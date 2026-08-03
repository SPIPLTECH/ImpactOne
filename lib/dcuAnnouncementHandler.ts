import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import Announcement from "@/models/Announcement";
import User from "@/models/User";

export async function handleAnnouncementGet(req: NextRequest, kind: "notification" | "news" | "notice") {
  try {
    await connectDB();
    const dcu = await requireDcuUser(req);
    if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const items = await Announcement.find({ district: dcu.district, kind })
      .populate("targetUserId", "fullName username")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shaped = items.map((i: any) => ({ ...i, targetUser: i.targetUserId }));

    return NextResponse.json({ items: shaped });
  } catch (err) {
    console.error(`[dcu/${kind}] GET failed:`, err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error while loading" },
      { status: 500 }
    );
  }
}

export async function handleAnnouncementPost(req: NextRequest, kind: "notification" | "news" | "notice") {
  try {
    await connectDB();
    const dcu = await requireDcuUser(req);
    if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { audience, targetUserId, title, message } = body;

    if (!title?.trim() || !message?.trim()) {
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
      const target = await User.findOne({ _id: targetUserId, district: dcu.district });
      if (!target) {
        return NextResponse.json({ message: "That ALC/Intern is not in your district" }, { status: 400 });
      }
    }

    const created = await Announcement.create({
      kind,
      district: dcu.district,
      audience,
      targetUserId: audience === "single" ? targetUserId : null,
      title,
      message,
      createdByUserId: dcu._id,
    });

    return NextResponse.json({ message: "Sent", item: created }, { status: 201 });
  } catch (err) {
    console.error(`[dcu/${kind}] POST failed:`, err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error while sending" },
      { status: 500 }
    );
  }
}