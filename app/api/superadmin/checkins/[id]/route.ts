import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import Checkin from "@/models/CheckIn";
import { getSessionFromRequest } from "@/lib/auth";

// PUT: edit a checkin (e.g. change status, district, etc.)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const checkin = await Checkin.findByIdAndUpdate(params.id, { $set: body }, { new: true });
  if (!checkin) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Updated", checkin }, { status: 200 });
}

// DELETE: remove a checkin
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const deleted = await Checkin.findByIdAndDelete(params.id);
  if (!deleted) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Deleted" }, { status: 200 });
}