import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import EventSubmission from "@/models/EventSubmission";

// Real, approved-only counts of how many of each event type this ALC/Intern
// has completed so far. Used to fill the 3 rings on the dashboard home
// screen — just the count, not a fraction of anything.
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== "ALC" && session.role !== "Intern")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [studentSessionCount, teacherOrientationCount, parentMeetCount] = await Promise.all([
      EventSubmission.countDocuments({
        alcUser: session.id,
        status: "approved",
        eventType: "student-session",
      }),
      EventSubmission.countDocuments({
        alcUser: session.id,
        status: "approved",
        eventType: "teacher-orientation",
      }),
      EventSubmission.countDocuments({
        alcUser: session.id,
        status: "approved",
        eventType: "parent-meeting",
      }),
    ]);

    return NextResponse.json({
      studentSession: { done: studentSessionCount },
      teacherOrientation: { done: teacherOrientationCount },
      parentMeet: { done: parentMeetCount },
    });
  } catch (err) {
    console.error("[dashboard/stats] failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}