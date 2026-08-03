import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EventSubmission from "@/models/EventSubmission";
import { getSessionFromRequest } from "@/lib/auth";

const VALID_EVENT_TYPES = ["student-session", "parent-meeting", "teacher-orientation"];

// Weight each Student Session standard-selection contributes toward the
// school's completion requirement of 3. "Combine" alone fulfills all 3 in
// one submission; every other option (single standard or a pair) counts
// as 1, so three of those submissions are needed to reach the same total.
const CLASS_OPTION_WEIGHTS: Record<string, number> = {
  "8th Std": 1,
  "9th Std": 1,
  "10th Std": 1,
  "8th & 9th Std": 1,
  "9th & 10th Std": 1,
  "8th & 10th Std": 1,
  "Combine (8th, 9th & 10th)": 3,
};

const VALID_CONDUCTED_AT = ["School", "Self Authorized Learning Center (SALC)"];

// The "+" variants mean the visit covered BOTH Teacher Orientation and
// Parent Meeting. In that case we create one EventSubmission per event
// type so each shows up correctly in that event's completion count.
const VALID_SESSION_TYPES: Record<string, string[]> = {
  "teacher-orientation": ["Teacher Orientation", "Teacher Orientation + Parent Meeting"],
  "parent-meeting": ["Parent Meeting", "Parent Meeting + Teacher Orientation"],
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== "ALC" && session.role !== "Intern")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // The video is uploaded DIRECTLY to Cloudinary from the browser (see
    // lib/cloudinaryClient.ts). This route only ever receives small JSON
    // (a URL, not file bytes) — that's what keeps it under Vercel's
    // serverless function payload limit and avoids FUNCTION_PAYLOAD_TOO_LARGE.
    const body = await req.json();
    const {
      eventType,
      instituteName,
      classOfStudents,
      conductedAt,
      sessionType,
      presentCount: presentCountRaw,
      teacherCount: teacherCountRaw,
      parentCount: parentCountRaw,
      district,
      alcCenterCode,
      gps,
      videoUrl,
    } = body || {};

    const presentCount = Number(presentCountRaw);
    const teacherCount = Number(teacherCountRaw);
    const parentCount = Number(parentCountRaw);

    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ message: "Invalid event type" }, { status: 400 });
    }
    if (!instituteName) {
      return NextResponse.json(
        { message: "Please select the school this event belongs to" },
        { status: 400 }
      );
    }
    if (!district) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { message: "Please record the event video (10s)" },
        { status: 400 }
      );
    }

    // ---- Student Session ----
    if (eventType === "student-session") {
      if (!presentCount || presentCount <= 0) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
      }
      if (!classOfStudents || !(classOfStudents in CLASS_OPTION_WEIGHTS)) {
        return NextResponse.json(
          { message: "Please select which standard(s) this session was for" },
          { status: 400 }
        );
      }

      const weight = CLASS_OPTION_WEIGHTS[classOfStudents];

      const submission = await EventSubmission.create({
        alcUser: session.id,
        district,
        alcCenterCode,
        eventType,
        classOfStudents,
        weight, // used by the admin dashboard to auto-calculate school completion (3 needed)
        instituteName,
        presentCount,
        video: { url: videoUrl, gps: gps || {}, capturedAt: new Date() },
        status: "pending",
      });

      return NextResponse.json(
        { message: "Event submitted successfully", id: submission._id },
        { status: 201 }
      );
    }

    // ---- Teacher Orientation / Parent Meeting ----
    if (eventType === "teacher-orientation" || eventType === "parent-meeting") {
      if (!conductedAt || !VALID_CONDUCTED_AT.includes(conductedAt)) {
        return NextResponse.json(
          { message: "Please select where this was conducted" },
          { status: 400 }
        );
      }
      const allowedSessionTypes = VALID_SESSION_TYPES[eventType];
      if (!sessionType || !allowedSessionTypes.includes(sessionType)) {
        return NextResponse.json(
          { message: "Please select what was conducted" },
          { status: 400 }
        );
      }

      const isCombined = sessionType.includes("+");
      const capturedAt = new Date();

      if (!isCombined) {
        if (!presentCount || presentCount <= 0) {
          return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }
        const submission = await EventSubmission.create({
          alcUser: session.id,
          district,
          alcCenterCode,
          instituteName,
          conductedAt,
          eventType,
          sessionType,
          presentCount,
          weight: 1,
          video: { url: videoUrl, gps: gps || {}, capturedAt },
          status: "pending",
        });
        return NextResponse.json(
          { message: "Event submitted successfully", id: submission._id },
          { status: 201 }
        );
      }

      // Combined visit — separate teacher/parent counts, credit both events
      // with one video/GPS reference.
      if (!teacherCount || teacherCount <= 0) {
        return NextResponse.json(
          { message: "Please enter how many teachers were present" },
          { status: 400 }
        );
      }
      if (!parentCount || parentCount <= 0) {
        return NextResponse.json(
          { message: "Please enter how many parents were present" },
          { status: 400 }
        );
      }

      const sharedFields = {
        alcUser: session.id,
        district,
        alcCenterCode,
        instituteName,
        conductedAt,
        weight: 1,
        video: { url: videoUrl, gps: gps || {}, capturedAt },
        status: "pending" as const,
      };

      const [teacherSubmission, parentSubmission] = await Promise.all([
        EventSubmission.create({
          ...sharedFields,
          eventType: "teacher-orientation",
          sessionType: "Teacher Orientation + Parent Meeting",
          presentCount: teacherCount,
          combinedWith: "parent-meeting",
        }),
        EventSubmission.create({
          ...sharedFields,
          eventType: "parent-meeting",
          sessionType: "Parent Meeting + Teacher Orientation",
          presentCount: parentCount,
          combinedWith: "teacher-orientation",
        }),
      ]);

      return NextResponse.json(
        {
          message: "Event submitted successfully for both Teacher Orientation and Parent Meeting",
          ids: [teacherSubmission._id, parentSubmission._id],
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ message: "Invalid event type" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error, please try again" }, { status: 500 });
  }
}