import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import User from "@/models/User";

const EDITABLE_FIELDS = ["fullName", "phone", "email", "alcCenterName", "role"];

export async function PUT(req: NextRequest, context: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  const params = await Promise.resolve((context as any).params);
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const target = await User.findOne({ _id: params.id, district: dcu.district });
  if (!target) return NextResponse.json({ message: "Not found" }, { status: 404 });

  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any)[field] = body[field];
    }
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
