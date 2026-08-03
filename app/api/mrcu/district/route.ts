import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import CheckIn from "@/models/CheckIn";
import EventSubmission from "@/models/EventSubmission";
import { computeSchoolStats } from "@/lib/dcuSchoolStats";

const DISTRICTS = ["Nagpur", "Wardha", "Chandrapur", "Bhandara", "Gondiya", "Gadchiroli"];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || session.role !== "MRCU") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const district = req.nextUrl.searchParams.get("district") || "";
    if (!DISTRICTS.includes(district)) {
      return NextResponse.json({ message: "Invalid district" }, { status: 400 });
    }

    // Only ever what DCU has already approved — nothing pending/rejected shows here.
    const [checkins, events] = await Promise.all([
      CheckIn.find({ district, status: "approved" })
        .populate("alcUser", "fullName username alcCenterName role")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
      EventSubmission.find({ district, status: "approved" })
        .populate("alcUser", "fullName username alcCenterName role")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
    ]);

    const studentSessions = events.filter((e) => e.eventType === "student-session").length;
    const teacherOrientations = events.filter((e) => e.eventType === "teacher-orientation").length;
    const parentMeetings = events.filter((e) => e.eventType === "parent-meeting").length;

    const studentsImpacted = events
      .filter((e) => e.eventType === "student-session")
      .reduce((sum, e) => sum + (e.presentCount || 0), 0);
    const teachersImpacted = events
      .filter((e) => e.eventType === "teacher-orientation")
      .reduce((sum, e) => sum + (e.presentCount || 0), 0);
    const parentsImpacted = events
      .filter((e) => e.eventType === "parent-meeting")
      .reduce((sum, e) => sum + (e.presentCount || 0), 0);

    const { schools } = await computeSchoolStats(district);

    return NextResponse.json({
      district,
      analytics: {
        schoolsCovered: schools.length,
        studentSessions,
        teacherOrientations,
        parentMeetings,
        studentsImpacted,
        teachersImpacted,
        parentsImpacted,
      },
      checkins,
      events,
    });
  } catch (err) {
    console.error("[mrcu/district] failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}