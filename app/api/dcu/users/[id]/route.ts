import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import User from "@/models/User";

export async function PATCH(req: NextRequest, context: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  const params = await Promise.resolve((context as any).params);
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const target = await User.findOne({ _id: params.id, district: dcu.district });
  if (!target) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (body.action === "approve") {
    target.status = "approved";
    target.rejectReason = undefined;
  } else if (body.action === "reject") {
    target.status = "rejected";
    target.rejectReason = body.reason || "Rejected by DCU";
  } else {
    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  }

  await target.save();
  return NextResponse.json({ message: "Updated" });
}

export async function DELETE(req: NextRequest, context: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  const params = await Promise.resolve((context as any).params);
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await User.deleteOne({ _id: params.id, district: dcu.district });
  return NextResponse.json({ message: "Deleted" });
}
