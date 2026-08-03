import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import { computeSchoolStats } from "@/lib/dcuSchoolStats";
import PaymentMilestone from "@/models/PaymentMilestone";
import PaymentRequest from "@/models/PaymentRequest";
import Announcement from "@/models/Announcement";
import User from "@/models/User";

const SCHOOLS_PER_TRANCHE = 2;
const AMOUNT_PER_TRANCHE = 1500;

export async function POST(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { alcUserId } = await req.json();
  if (!alcUserId) return NextResponse.json({ message: "alcUserId is required" }, { status: 400 });

  const targetUser = await User.findOne({ _id: alcUserId, district: dcu.district });
  if (!targetUser) return NextResponse.json({ message: "ALC/Intern not found in your district" }, { status: 404 });

  // Recompute server-side — never trust a client-sent tranche count.
  const { completedCountByAlc } = await computeSchoolStats(dcu.district);
  const schoolsCompletedTotal = completedCountByAlc[alcUserId] || 0;

  let milestone = await PaymentMilestone.findOne({ alcUserId });
  const schoolsAlreadyPaidFor = milestone?.schoolsAlreadyPaidFor || 0;
  const pendingSchools = schoolsCompletedTotal - schoolsAlreadyPaidFor;
  const tranches = Math.floor(pendingSchools / SCHOOLS_PER_TRANCHE);

  if (tranches < 1) {
    return NextResponse.json({ message: "This ALC/Intern is not currently eligible" }, { status: 400 });
  }

  const schoolsFrom = schoolsAlreadyPaidFor + 1;
  const schoolsTo = schoolsAlreadyPaidFor + tranches * SCHOOLS_PER_TRANCHE;
  const amount = tranches * AMOUNT_PER_TRANCHE;

  const paymentRequest = await PaymentRequest.create({
    alcUserId,
    district: dcu.district,
    schoolsFrom,
    schoolsTo,
    amount,
    status: "sent",
  });

  // Advance the milestone so this block can't be notified again.
  if (milestone) {
    milestone.schoolsAlreadyPaidFor = schoolsTo;
    await milestone.save();
  } else {
    milestone = await PaymentMilestone.create({ alcUserId, schoolsAlreadyPaidFor: schoolsTo });
  }

  await Announcement.create({
    kind: "notification",
    district: dcu.district,
    audience: "single",
    targetUserId: alcUserId,
    title: "Payment Eligibility",
    message: `Congratulations! You've completed ${schoolsTo} schools (₹${amount} for schools ${schoolsFrom}-${schoolsTo}). Please fill your bank details to receive the payment.`,
    createdByUserId: dcu._id,
    paymentRequestId: paymentRequest._id,
  });

  return NextResponse.json({ message: "Notification sent", paymentRequest }, { status: 201 });
}
