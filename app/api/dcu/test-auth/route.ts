import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ step: "session", ok: false, message: "No session found (cookie missing or invalid)" });
    }

    await connectDB();
    const dcu = await User.findById(session.id).lean();

    return NextResponse.json({
      step: "done",
      ok: true,
      sessionRole: session.role,
      sessionDistrict: session.district,
      dbUserFound: !!dcu,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dbUserRole: (dcu as any)?.role,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dbUserDistrict: (dcu as any)?.district,
    });
  } catch (err) {
    return NextResponse.json({
      step: "error",
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}