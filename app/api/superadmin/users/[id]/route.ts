import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const user = await User.findByIdAndUpdate(params.id, { $set: body }, { new: true });
  return NextResponse.json({ message: "Updated", user }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await User.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Deleted" }, { status: 200 });
}
