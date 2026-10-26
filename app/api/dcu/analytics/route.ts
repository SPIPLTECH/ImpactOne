import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import { computeSchoolStats } from "@/lib/dcuSchoolStats";
import EventSubmission from "@/models/EventSubmission";
import CheckIn from "@/models/CheckIn";

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { schools, alcSummary } = await computeSchoolStats(dcu.district);

  const perAlc = alcSummary
    .map((a) => ({ alcName: a.alcName, completed: a.completed }))
    .sort((a, b) => b.completed - a.completed);

  if (req.nextUrl.searchParams.get("summary")) {
    const [studentSessionsCompleted, teacherOrientationsCompleted, parentMeetingsCompleted, momEvents, parikshelaEvents, otherEvents] = await Promise.all([
      EventSubmission.countDocuments({ district: dcu.district, status: "approved", eventType: "student-session" }),
      EventSubmission.countDocuments({ district: dcu.district, status: "approved", eventType: "teacher-orientation" }),
      EventSubmission.countDocuments({ district: dcu.district, status: "approved", eventType: "parent-meeting" }),
      EventSubmission.countDocuments({ district: dcu.district, status: "approved", eventType: "mom" }),
      EventSubmission.countDocuments({ district: dcu.district, status: "approved", eventType: "parikshela-jata-jata" }),
      EventSubmission.countDocuments({ district: dcu.district, status: "approved", eventType: "others" }),
    ]);

    const [totalSubmissions, approvedSubmissions, pendingSubmissions, rejectedSubmissions] = await Promise.all([
      CheckIn.countDocuments({ district: dcu.district }),
      CheckIn.countDocuments({ district: dcu.district, status: "approved" }),
      CheckIn.countDocuments({ district: dcu.district, status: "pending" }),
      CheckIn.countDocuments({ district: dcu.district, status: "rejected" }),
    ]);

    return NextResponse.json({
      perAlc,
      summary: {
        schoolsCovered: schools.length,
        studentSessionsCompleted,
        teacherOrientationsCompleted,
        parentMeetingsCompleted,
        momEvents,
        parikshelaEvents,
        otherEvents,
        totalSubmissions,
        approvedSubmissions,
        pendingSubmissions,
        rejectedSubmissions,
      },
    });
  }

  return NextResponse.json({ perAlc });
}
