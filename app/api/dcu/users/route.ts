import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "pending";

  const users = await User.find({
    district: dcu.district,
    role: { $in: ["ALC", "Intern"] },
    status,
  })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ users });
}
