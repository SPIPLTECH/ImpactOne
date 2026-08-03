import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import EventSubmission from "@/models/EventSubmission";
import { computeSchoolStats } from "@/lib/dcuSchoolStats";

const DISTRICTS = ["Nagpur", "Wardha", "Chandrapur", "Bhandara", "Gondiya", "Gadchiroli"];

async function districtNumbers(district?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseFilter: any = { status: "approved" };
  if (district) baseFilter.district = district;

  const [studentSessions, teacherOrientations, parentMeetings] = await Promise.all([
    EventSubmission.countDocuments({ ...baseFilter, eventType: "student-session" }),
    EventSubmission.countDocuments({ ...baseFilter, eventType: "teacher-orientation" }),
    EventSubmission.countDocuments({ ...baseFilter, eventType: "parent-meeting" }),
  ]);

  const [studentsImpactedAgg, teachersImpactedAgg, parentsImpactedAgg] = await Promise.all([
    EventSubmission.aggregate([
      { $match: { ...baseFilter, eventType: "student-session" } },
      { $group: { _id: null, total: { $sum: "$presentCount" } } },
    ]),
    EventSubmission.aggregate([
      { $match: { ...baseFilter, eventType: "teacher-orientation" } },
      { $group: { _id: null, total: { $sum: "$presentCount" } } },
    ]),
    EventSubmission.aggregate([
      { $match: { ...baseFilter, eventType: "parent-meeting" } },
      { $group: { _id: null, total: { $sum: "$presentCount" } } },
    ]),
  ]);

  const { schools } = await computeSchoolStats(district);

  return {
    schoolsCovered: schools.length,
    studentSessions,
    teacherOrientations,
    parentMeetings,
    studentsImpacted: studentsImpactedAgg[0]?.total || 0,
    teachersImpacted: teachersImpactedAgg[0]?.total || 0,
    parentsImpacted: parentsImpactedAgg[0]?.total || 0,
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || session.role !== "MRCU") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const combined = await districtNumbers();

    const perDistrict = await Promise.all(
      DISTRICTS.map(async (d) => ({ district: d, ...(await districtNumbers(d)) }))
    );

    return NextResponse.json({ combined, perDistrict });
  } catch (err) {
    console.error("[mrcu/overview] failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}