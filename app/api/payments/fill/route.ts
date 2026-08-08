import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";
import PaymentRequest from "@/models/PaymentRequest";

// GET /api/payments/fill?id=<paymentRequestId>
// Returns the tranche details (amount, schools range, status, whatever bank
// details are already filled) so the ALC/Intern can see what they're filling
// the form for.
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== "ALC" && session.role !== "Intern")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ message: "id is required" }, { status: 400 });

    const request = await PaymentRequest.findOne({ _id: id, alcUserId: session.id }).lean();
    if (!request) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ request });
  } catch (err) {
    console.error("[payments/fill] GET failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

// POST — the ALC/Intern submits their bank details against a specific
// PaymentRequest (created earlier by DCU's "Send" action).
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== "ALC" && session.role !== "Intern")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      paymentRequestId,
      bankAccountHolderName,
      bankAccountNumber,
      ifscCode,
      bankName,
      branchName,
    } = body;

    if (!paymentRequestId) {
      return NextResponse.json({ message: "paymentRequestId is required" }, { status: 400 });
    }
    if (!bankAccountHolderName || !bankAccountNumber || !ifscCode) {
      return NextResponse.json(
        { message: "Account holder name, account number, and IFSC code are required" },
        { status: 400 }
      );
    }

    const request = await PaymentRequest.findOne({ _id: paymentRequestId, alcUserId: session.id });
    if (!request) {
      return NextResponse.json({ message: "Payment request not found" }, { status: 404 });
    }

    request.bankAccountHolderName = bankAccountHolderName;
    request.bankAccountNumber = bankAccountNumber;
    request.ifscCode = ifscCode;
    request.bankName = bankName || "";
    request.branchName = branchName || "";
    request.status = "filled";
    request.filledAt = new Date();
    await request.save();

    return NextResponse.json({ message: "Bank details submitted successfully" });
  } catch (err) {
    console.error("[payments/fill] POST failed:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}