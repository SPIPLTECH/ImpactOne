import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import CheckIn from "@/models/CheckIn";
import EventSubmission from "@/models/EventSubmission";

const EVENT_TYPE_LABELS: Record<string, string> = {
  "student-session": "Student Session",
  "teacher-orientation": "Teacher Orientation",
  "parent-meeting": "Parent Meeting",
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== "ALC" && session.role !== "Intern")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [checkins, events] = await Promise.all([
      CheckIn.find({ alcUser: session.id }).sort({ createdAt: -1 }).lean(),
      EventSubmission.find({ alcUser: session.id }).sort({ createdAt: -1 }).lean(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkinItems = checkins.map((c: any) => ({
      id: String(c._id),
      title: `Check-in — ${c.instituteName || "Institute"}`,
      status: c.status,
      createdAt: c.createdAt,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventItems = events.map((e: any) => ({
      id: String(e._id),
      title: `${EVENT_TYPE_LABELS[e.eventType] || e.eventType} — ${e.instituteName || "Institute"}`,
      status: e.status,
      createdAt: e.createdAt,
    }));

    const items = [...checkinItems, ...eventItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[history] failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}