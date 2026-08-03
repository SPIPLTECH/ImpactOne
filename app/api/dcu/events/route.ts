import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import EventSubmission from "@/models/EventSubmission";

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "pending";
  const eventType = req.nextUrl.searchParams.get("eventType");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { district: dcu.district, status };
  if (eventType) filter.eventType = eventType;

  const events = await EventSubmission.find(filter)
    .populate("alcUser", "fullName username")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ events });
}
