import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import CheckIn from "@/models/CheckIn";

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "pending";

  const submissions = await CheckIn.find({ district: dcu.district, status })
    .populate("alcUser", "fullName username")
    .sort({ createdAt: -1 })
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaped = submissions.map((s: any) => ({ ...s, alcUser: s.alcUser }));

  return NextResponse.json({ submissions: shaped });
}
