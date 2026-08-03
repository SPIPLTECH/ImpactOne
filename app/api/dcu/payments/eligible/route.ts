import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import { computeSchoolStats } from "@/lib/dcuSchoolStats";
import PaymentMilestone from "@/models/PaymentMilestone";
import User from "@/models/User";

const SCHOOLS_PER_TRANCHE = 2;
const AMOUNT_PER_TRANCHE = 1500;

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { completedCountByAlc } = await computeSchoolStats(dcu.district);

  const alcUserIds = Object.keys(completedCountByAlc);
  const milestones = await PaymentMilestone.find({ alcUserId: { $in: alcUserIds } }).lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const milestoneMap: Record<string, any> = {};
  milestones.forEach((m: any) => (milestoneMap[String(m.alcUserId)] = m));

  const users = await User.find({ _id: { $in: alcUserIds } }).select("fullName username role").lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMap: Record<string, any> = {};
  users.forEach((u: any) => (userMap[String(u._id)] = u));

  const eligible = [];
  for (const alcUserId of alcUserIds) {
    const schoolsCompletedTotal = completedCountByAlc[alcUserId] || 0;
    const schoolsAlreadyPaidFor = milestoneMap[alcUserId]?.schoolsAlreadyPaidFor || 0;
    const pendingSchools = schoolsCompletedTotal - schoolsAlreadyPaidFor;
    const tranches = Math.floor(pendingSchools / SCHOOLS_PER_TRANCHE);

    if (tranches >= 1) {
      const u = userMap[alcUserId];
      eligible.push({
        alcUserId,
        name: u?.fullName || u?.username || "Unknown",
        role: u?.role || "",
        schoolsCompletedTotal,
        schoolsAlreadyPaidFor,
        pendingSchools,
        tranches,
        amount: tranches * AMOUNT_PER_TRANCHE,
      });
    }
  }

  return NextResponse.json({ eligible });
}
