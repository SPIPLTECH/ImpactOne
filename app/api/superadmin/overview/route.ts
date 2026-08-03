import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import Checkin from "@/models/CheckIn";
import EventSubmission from "@/models/EventSubmission";
import User from "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [checkins, events, userCounts] = await Promise.all([
    Checkin.find({ status: "approved" }).sort({ createdAt: -1 }).limit(200),
    EventSubmission.find({ status: "approved" }).sort({ createdAt: -1 }).limit(200),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
  ]);

  return NextResponse.json({ checkins, events, userCounts }, { status: 200 });
}
