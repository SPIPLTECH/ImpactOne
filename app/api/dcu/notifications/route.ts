import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import Announcement from "@/models/Announcement";
import User from "@/models/User";

const KIND = "notification" as const;

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || session.role !== "DCU") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const dcu = await User.findById(session.id).lean();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dcuUser = dcu as any;
    if (!dcuUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const items = await Announcement.find({ district: dcuUser.district, kind: KIND })
      .populate("targetUserId", "fullName username")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shaped = items.map((i: any) => ({ ...i, targetUser: i.targetUserId }));

    return NextResponse.json({ items: shaped });
  } catch (err) {
    console.error("[dcu/notifications] GET failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error while loading" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || session.role !== "DCU") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const dcu = await User.findById(session.id).lean();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dcuUser = dcu as any;
    if (!dcuUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { audience, targetUserId, title, message } = body;

    if (!title || !String(title).trim() || !message || !String(message).trim()) {
      return NextResponse.json({ message: "Title and message are required" }, { status: 400 });
    }
    if (audience !== "all" && audience !== "single") {
      return NextResponse.json({ message: "Invalid audience" }, { status: 400 });
    }

    if (audience === "single") {
      if (!targetUserId) {
        return NextResponse.json(
          { message: "targetUserId is required for a single-recipient send" },
          { status: 400 }
        );
      }
      const target = await User.findOne({ _id: targetUserId, district: dcuUser.district });
      if (!target) {
        return NextResponse.json({ message: "That ALC/Intern is not in your district" }, { status: 400 });
      }
    }

    const created = await Announcement.create({
      kind: KIND,
      district: dcuUser.district,
      audience,
      targetUserId: audience === "single" ? targetUserId : null,
      title,
      message,
      createdByUserId: dcuUser._id,
    });

    return NextResponse.json({ message: "Sent", item: created }, { status: 201 });
  } catch (err) {
    console.error("[dcu/notifications] POST failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error while sending" },
      { status: 500 }
    );
  }
}