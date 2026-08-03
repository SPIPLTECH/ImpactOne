import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import PaymentRequest from "@/models/PaymentRequest";

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const requests = await PaymentRequest.find({ district: dcu.district })
    .populate("alcUserId", "fullName username")
    .sort({ createdAt: -1 })
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaped = requests.map((r: any) => ({ ...r, alcUser: r.alcUserId }));

  return NextResponse.json({ requests: shaped });
}
