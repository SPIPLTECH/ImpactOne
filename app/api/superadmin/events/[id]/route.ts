import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import EventSubmission from "@/models/EventSubmission";
import { getSessionFromRequest } from "@/lib/auth";

// PUT: edit an event submission
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const event = await EventSubmission.findByIdAndUpdate(params.id, { $set: body }, { new: true });
  if (!event) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Updated", event }, { status: 200 });
}

// DELETE: remove an event submission (video)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const deleted = await EventSubmission.findByIdAndDelete(params.id);
  if (!deleted) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Deleted" }, { status: 200 });
}