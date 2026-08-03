import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import { computeSchoolStats } from "@/lib/dcuSchoolStats";

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { schools, alcSummary } = await computeSchoolStats(dcu.district);
  return NextResponse.json({ schools, alcSummary });
}
