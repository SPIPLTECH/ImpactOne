import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const users = await User.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ users }, { status: 200 });
}
