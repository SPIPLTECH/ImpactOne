import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import Announcement from "@/models/Announcement";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const result: Record<string, unknown> = {};
  try {
    await connectDB();
    result.step = "connected-db";

    const session = getSessionFromRequest(req);
    if (!session || session.role !== "DCU") {
      return NextResponse.json({ ...result, ok: false, message: "Not a DCU session" });
    }
    result.step = "session-ok";

    const dcu = await User.findById(session.id).lean();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dcuUser = dcu as any;
    result.step = "user-loaded";
    result.district = dcuUser?.district;

    // Try reading first (should just return an empty array first time — no error expected)
    const items = await Announcement.find({ district: dcuUser.district, kind: "notification" }).lean();
    result.step = "read-ok";
    result.existingCount = items.length;

    // Try writing a real test document
    const created = await Announcement.create({
      kind: "notification",
      district: dcuUser.district,
      audience: "single",
      targetUserId: dcuUser._id, // send it to yourself, harmless test
      title: "TEST — diagnostic ping",
      message: "This is a diagnostic test document created by /api/dcu/test-announcement.",
      createdByUserId: dcuUser._id,
    });
    result.step = "write-ok";
    result.createdId = String(created._id);

    return NextResponse.json({ ...result, ok: true });
  } catch (err) {
    return NextResponse.json({
      ...result,
      ok: false,
      errorName: err instanceof Error ? err.name : "Unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
  }
}