import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import Announcement from "@/models/Announcement";

// Real notifications for the logged-in ALC/Intern: everything DCU sent to
// "All ALC/Intern" in their district, plus anything sent to them personally.
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== "ALC" && session.role !== "Intern")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const items = await Announcement.find({
      kind: "notification",
      district: session.district,
      $or: [{ audience: "all" }, { audience: "single", targetUserId: session.id }],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications = items.map((i: any) => ({
      id: String(i._id),
      title: i.title,
      message: i.message,
      createdAt: i.createdAt,
      read: Array.isArray(i.readBy) ? i.readBy.some((u: unknown) => String(u) === session.id) : false,
    }));

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[notifications] failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}