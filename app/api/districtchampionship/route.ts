import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import EventSubmission from "@/models/EventSubmission";
import { computeSchoolStats } from "@/lib/dcuSchoolStats";

// Public, read-only leaderboard. No auth — this is meant to be shown on a
// screen / shared link so all 6 districts can see live standings.
const DISTRICTS = ["Nagpur", "Wardha", "Chandrapur", "Bhandara", "Gondiya", "Gadchiroli"];

async function districtNumbers(district: string) {
  const baseFilter = { status: "approved", district } as const;

  const [studentSessions, teacherOrientations, parentMeetings] = await Promise.all([
    EventSubmission.countDocuments({ ...baseFilter, eventType: "student-session" }),
    EventSubmission.countDocuments({ ...baseFilter, eventType: "teacher-orientation" }),
    EventSubmission.countDocuments({ ...baseFilter, eventType: "parent-meeting" }),
  ]);

  const { schools } = await computeSchoolStats(district);

  return {
    district,
    schoolsCovered: schools.length,
    studentSessions,
    parentMeetings,
    teacherOrientations,
  };
}

export async function GET() {
  try {
    await connectDB();

    const rows = await Promise.all(DISTRICTS.map((d) => districtNumbers(d)));

    // Rank purely by schools covered (highest first). Ties broken by total
    // activity (sessions + meetings + orientations) as a sensible tiebreaker.
    const ranked = [...rows]
      .sort((a, b) => {
        if (b.schoolsCovered !== a.schoolsCovered) return b.schoolsCovered - a.schoolsCovered;
        const aTotal = a.studentSessions + a.parentMeetings + a.teacherOrientations;
        const bTotal = b.studentSessions + b.parentMeetings + b.teacherOrientations;
        return bTotal - aTotal;
      })
      .map((row, idx) => ({ ...row, rank: idx + 1 }));

    return NextResponse.json({
      title: "Vidarbha East District Championship - Mission AI Ready",
      updatedAt: new Date().toISOString(),
      districts: ranked,
    });
  } catch (err) {
    console.error("[districtchampionship] failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}