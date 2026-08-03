import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import PaymentReceipt from "@/models/PaymentReceipt";

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const receipts = await PaymentReceipt.find({ district: dcu.district })
    .populate("alcUser", "fullName username")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ receipts });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { alcUserId, receiptImageUrl, note } = body;

  if (!alcUserId || !receiptImageUrl) {
    return NextResponse.json({ message: "ALC/Intern and receipt image are required" }, { status: 400 });
  }

  await PaymentReceipt.create({
    alcUser: alcUserId,
    dcuUser: dcu._id,
    district: dcu.district,
    receiptImageUrl,
    note,
  });

  return NextResponse.json({ message: "Receipt submitted" }, { status: 201 });
}
