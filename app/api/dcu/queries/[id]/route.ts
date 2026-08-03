import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import Query from "@/models/Query";

export async function PATCH(req: NextRequest, context: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  const params = await Promise.resolve((context as any).params);
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const target = await Query.findOne({ _id: params.id, district: dcu.district });
  if (!target) return NextResponse.json({ message: "Not found" }, { status: 404 });

  if (body.response !== undefined) target.response = body.response;
  if (body.status !== undefined) target.status = body.status;

  await target.save();
  return NextResponse.json({ message: "Updated" });
}
