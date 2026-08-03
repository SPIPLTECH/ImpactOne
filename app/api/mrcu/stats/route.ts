import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import Checkin from "@/models/CheckIn";
import EventSubmission from "@/models/EventSubmission";
import { getSessionFromRequest } from "@/lib/auth";

const DISTRICTS = ["Nagpur", "Wardha", "Chandrapur", "Bhandara", "Gondiya", "Gadchiroli"];

export async function GET(req: NextRequest) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "MRCU") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // District-wise submission counts (check-ins + event videos combined) — used for the bar chart.
  const districtChart = await Promise.all(
    DISTRICTS.map(async (d) => {
      const [checkinCount, eventCount] = await Promise.all([
        Checkin.countDocuments({ district: d }),
        EventSubmission.countDocuments({ district: d }),
      ]);
      return { district: d, checkins: checkinCount, events: eventCount, total: checkinCount + eventCount };
    })
  );

  // Full submission lists across ALL statuses (pending/approved/rejected) — same visibility as
  // the Super Admin dashboard, minus any user/DCU management actions.
  const [checkins, events] = await Promise.all([
    Checkin.find({})
      .populate("alcUser", "fullName username alcCenterName")
      .sort({ district: 1, createdAt: -1 })
      .limit(500),
    EventSubmission.find({})
      .populate("alcUser", "fullName username alcCenterName")
      .sort({ district: 1, createdAt: -1 })
      .limit(500),
  ]);

  return NextResponse.json({ districtChart, checkins, events }, { status: 200 });
}