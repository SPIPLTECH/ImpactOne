import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import User from "@/models/User";
import CheckIn from "@/models/CheckIn";
import EventSubmission from "@/models/EventSubmission";

const VALID_EVENT_TYPES = [
  "student-session",
  "parent-meeting",
  "teacher-orientation",
  "mom",
  "parikshela-jata-jata",
  "others",
];

// Same non-counting list as app/api/event/capture/route.ts — these event
// types are stored and reviewed exactly like the others but must never
// contribute to a school's Student Session completion count.
const NON_COUNTING_EVENT_TYPES = ["mom", "parikshela-jata-jata", "others"];

const CLASS_OPTION_WEIGHTS: Record<string, number> = {
  "8th Std": 1,
  "9th Std": 1,
  "10th Std": 1,
  "8th & 9th Std": 1,
  "9th & 10th Std": 1,
  "8th & 10th Std": 1,
  "Combine (8th, 9th & 10th)": 3,
  "11th": 1,
  "12th": 1,
  "Combine (11th & 12th)": 3,
};

const VALID_CONDUCTED_AT = ["School", "Self Authorized Learning Center (SALC)"];

const VALID_SESSION_TYPES: Record<string, string[]> = {
  "teacher-orientation": ["Teacher Orientation", "Teacher Orientation + Parent Meeting"],
  "parent-meeting": ["Parent Meeting", "Parent Meeting + Teacher Orientation"],
};

// GET /api/dcu/add-missing-data?alcUserId=xxxx
// Returns the selected ALC/Intern's own details plus the list of school
// names they've previously used, so the DCU form can offer a "pick or type
// a new school" dropdown instead of a blank text box.
export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const alcUserId = req.nextUrl.searchParams.get("alcUserId");
  if (!alcUserId) {
    // No ALC selected yet — just return the district's approved ALC/Intern list.
    const users = await User.find({
      district: dcu.district,
      role: { $in: ["ALC", "Intern"] },
      status: "approved",
    })
      .select("-password")
      .sort({ fullName: 1 })
      .lean();
    return NextResponse.json({ users });
  }

  const alc = await User.findOne({
    _id: alcUserId,
    district: dcu.district,
    role: { $in: ["ALC", "Intern"] },
  })
    .select("-password")
    .lean();

  if (!alc) return NextResponse.json({ message: "ALC/Intern not found in your district" }, { status: 404 });

  const [checkinSchools, eventSchools] = await Promise.all([
    CheckIn.distinct("instituteName", { alcUser: alcUserId }),
    EventSubmission.distinct("instituteName", { alcUser: alcUserId }),
  ]);
  const schools = Array.from(new Set([...checkinSchools, ...eventSchools].filter(Boolean))).sort();

  return NextResponse.json({ alc, schools });
}

// POST /api/dcu/add-missing-data
// Lets a DCU submit, on behalf of an ALC/Intern who forgot to do it
// themselves, a check-in (photo) and/or an event (video) using files the
// ALC has already sent the DCU. Both go through the exact same
// pending -> approve/reject pipeline as normal ALC self-submissions
// (app/dcu/checkins, app/dcu/events), so once the DCU approves them the
// school-completion counts, payment eligibility and analytics graphs all
// update automatically — no separate code path for that.
export async function POST(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Invalid request body" }, { status: 400 });

  const { alcUserId, checkin, event } = body;

  if (!alcUserId) {
    return NextResponse.json({ message: "Please select the ALC/Intern this data belongs to" }, { status: 400 });
  }
  if (!checkin && !event) {
    return NextResponse.json({ message: "Add at least a check-in or an event" }, { status: 400 });
  }

  const alc = await User.findOne({
    _id: alcUserId,
    district: dcu.district,
    role: { $in: ["ALC", "Intern"] },
    status: "approved",
  }).lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alcDoc = alc as any;
  if (!alcDoc) {
    return NextResponse.json({ message: "ALC/Intern not found in your district" }, { status: 404 });
  }

  const result: { checkinId?: string; eventIds?: string[] } = {};

  // ---------------- Check-in ----------------
  if (checkin) {
    const { instituteName, photoUrl, gps, occurredAt } = checkin;
    if (!instituteName || !String(instituteName).trim()) {
      return NextResponse.json({ message: "Please enter/select the school for the check-in" }, { status: 400 });
    }
    if (!photoUrl) {
      return NextResponse.json({ message: "Please upload the check-in photo" }, { status: 400 });
    }

    const checkinDoc = await CheckIn.create({
      alcUser: alcDoc._id,
      district: dcu.district,
      alcCenterCode: alcDoc.alcCenterCode,
      alcCenterName: alcDoc.alcCenterName,
      instituteName: String(instituteName).trim(),
      photoUrl,
      gps: {
        lat: gps?.lat !== undefined && gps?.lat !== "" ? Number(gps.lat) : undefined,
        lng: gps?.lng !== undefined && gps?.lng !== "" ? Number(gps.lng) : undefined,
      },
      status: "pending",
      submittedVia: "dcu",
      addedByDcuUser: dcu._id,
    });

    // Let the DCU back-date the check-in to when it actually happened
    // (bypassing Mongoose's automatic timestamps, which always stamp "now"
    // on create() — a raw driver update is the reliable way to override it).
    if (occurredAt) {
      const when = new Date(occurredAt);
      if (!isNaN(when.getTime())) {
        await CheckIn.collection.updateOne({ _id: checkinDoc._id }, { $set: { createdAt: when } });
      }
    }

    result.checkinId = String(checkinDoc._id);
  }

  // ---------------- Event ----------------
  if (event) {
    const {
      eventType,
      instituteName,
      classOfStudents,
      specifyEvent,
      conductedAt,
      sessionType,
      presentCount: presentCountRaw,
      teacherCount: teacherCountRaw,
      parentCount: parentCountRaw,
      videoUrl,
      gps,
      occurredAt,
    } = event;

    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ message: "Please select a valid event type" }, { status: 400 });
    }
    if (!instituteName || !String(instituteName).trim()) {
      return NextResponse.json({ message: "Please enter/select the school for the event" }, { status: 400 });
    }
    if (!videoUrl) {
      return NextResponse.json({ message: "Please upload the event video" }, { status: 400 });
    }

    const trimmedInstitute = String(instituteName).trim();
    const capturedAt = occurredAt && !isNaN(new Date(occurredAt).getTime()) ? new Date(occurredAt) : new Date();
    const sharedVideo = { url: videoUrl, gps: gps || {}, capturedAt };
    const sharedBase = {
      alcUser: alcDoc._id,
      district: dcu.district,
      alcCenterCode: alcDoc.alcCenterCode,
      alcCenterName: alcDoc.alcCenterName,
      instituteName: trimmedInstitute,
      status: "pending" as const,
      submittedVia: "dcu" as const,
      addedByDcuUser: dcu._id,
    };

    const createdIds: string[] = [];

    if (eventType === "student-session") {
      const presentCount = Number(presentCountRaw);
      if (!presentCount || presentCount <= 0) {
        return NextResponse.json({ message: "Please enter how many students were present" }, { status: 400 });
      }
      if (!classOfStudents || !(classOfStudents in CLASS_OPTION_WEIGHTS)) {
        return NextResponse.json({ message: "Please select which standard(s) this session was for" }, { status: 400 });
      }
      const doc = await EventSubmission.create({
        ...sharedBase,
        eventType,
        classOfStudents,
        weight: CLASS_OPTION_WEIGHTS[classOfStudents],
        presentCount,
        video: sharedVideo,
      });
      createdIds.push(String(doc._id));
    } else if (eventType === "teacher-orientation" || eventType === "parent-meeting") {
      if (!conductedAt || !VALID_CONDUCTED_AT.includes(conductedAt)) {
        return NextResponse.json({ message: "Please select where this was conducted" }, { status: 400 });
      }
      const allowedSessionTypes = VALID_SESSION_TYPES[eventType];
      if (!sessionType || !allowedSessionTypes.includes(sessionType)) {
        return NextResponse.json({ message: "Please select what was conducted" }, { status: 400 });
      }
      const isCombined = String(sessionType).includes("+");

      if (!isCombined) {
        const presentCount = Number(presentCountRaw);
        if (!presentCount || presentCount <= 0) {
          return NextResponse.json({ message: "Please enter how many people were present" }, { status: 400 });
        }
        const doc = await EventSubmission.create({
          ...sharedBase,
          eventType,
          conductedAt,
          sessionType,
          presentCount,
          weight: 1,
          video: sharedVideo,
        });
        createdIds.push(String(doc._id));
      } else {
        const teacherCount = Number(teacherCountRaw);
        const parentCount = Number(parentCountRaw);
        if (!teacherCount || teacherCount <= 0) {
          return NextResponse.json({ message: "Please enter how many teachers were present" }, { status: 400 });
        }
        if (!parentCount || parentCount <= 0) {
          return NextResponse.json({ message: "Please enter how many parents were present" }, { status: 400 });
        }
        const [teacherDoc, parentDoc] = await Promise.all([
          EventSubmission.create({
            ...sharedBase,
            eventType: "teacher-orientation",
            conductedAt,
            sessionType: "Teacher Orientation + Parent Meeting",
            presentCount: teacherCount,
            weight: 1,
            combinedWith: "parent-meeting",
            video: sharedVideo,
          }),
          EventSubmission.create({
            ...sharedBase,
            eventType: "parent-meeting",
            conductedAt,
            sessionType: "Parent Meeting + Teacher Orientation",
            presentCount: parentCount,
            weight: 1,
            combinedWith: "teacher-orientation",
            video: sharedVideo,
          }),
        ]);
        createdIds.push(String(teacherDoc._id), String(parentDoc._id));
      }
    } else if (NON_COUNTING_EVENT_TYPES.includes(eventType)) {
      const presentCount = Number(presentCountRaw);
      if (!presentCount || presentCount <= 0) {
        return NextResponse.json({ message: "Please enter how many people were present" }, { status: 400 });
      }
      if (eventType === "others" && (!specifyEvent || !String(specifyEvent).trim())) {
        return NextResponse.json({ message: "Please specify the event" }, { status: 400 });
      }
      const doc = await EventSubmission.create({
        ...sharedBase,
        eventType,
        presentCount,
        specifyEvent: eventType === "others" ? String(specifyEvent).trim() : undefined,
        weight: 0,
        video: sharedVideo,
      });
      createdIds.push(String(doc._id));
    }

    if (occurredAt) {
      const when = new Date(occurredAt);
      if (!isNaN(when.getTime())) {
        await EventSubmission.collection.updateMany(
          { _id: { $in: createdIds.map((id) => new Types.ObjectId(id)) } },
          { $set: { createdAt: when } }
        );
      }
    }

    result.eventIds = createdIds;
  }

  return NextResponse.json(
    { message: "Missing data added successfully. It now appears in the normal pending review lists.", ...result },
    { status: 201 }
  );
}