import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import PaymentReceipt from "@/models/PaymentReceipt";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== "ALC" && session.role !== "Intern")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const receipts = await PaymentReceipt.find({ alcUser: session.id })
    .populate("dcuUser", "fullName username")
    .sort({ createdAt: -1 });

  return NextResponse.json({ receipts }, { status: 200 });
}