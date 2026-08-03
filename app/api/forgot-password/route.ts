import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendMail } from "@/lib/mailer";

type OtpRecord = { otp: string; expiresAt: number; verified: boolean };

// In-memory OTP store. key: email -> { otp, expiresAt, verified }
const otpStore = new Map<string, OtpRecord>();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, email: emailRaw } = body;
    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : emailRaw;

    if (!action || !email) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---- SEND OTP ----
    if (action === "send-otp") {
      const user = await User.findOne({
        email: { $regex: `^${email}$`, $options: "i" },
      });
      if (!user) {
        return NextResponse.json(
          { message: "No account found with this email" },
          { status: 404 }
        );
      }

      const otp = generateOtp();
      otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
        verified: false,
      });

      // Actual fix — OTP was only being console.logged before, never emailed.
      await sendMail(
        email,
        "impactOne — Your OTP for Password Reset",
        `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
           <p>Hi${user.fullName ? " " + user.fullName : ""},</p>
           <p>Your One-Time Password (OTP) to reset your impactOne account password is:</p>
           <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0;color:#e8003f">${otp}</p>
           <p>This OTP is valid for <b>5 minutes</b>. Do not share it with anyone.</p>
           <p>If you did not request this, you can safely ignore this email.</p>
         </div>`
      );

      return NextResponse.json(
        { message: "OTP sent to registered email" },
        { status: 200 }
      );
    }

    // ---- VERIFY OTP ----
    if (action === "verify-otp") {
      const { otp } = body;
      const record = otpStore.get(email);

      if (!record) {
        return NextResponse.json(
          { message: "OTP not requested or expired, please resend" },
          { status: 400 }
        );
      }
      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return NextResponse.json(
          { message: "OTP expired, please resend" },
          { status: 400 }
        );
      }
      if (record.otp !== otp) {
        return NextResponse.json(
          { message: "Invalid OTP" },
          { status: 400 }
        );
      }

      record.verified = true;
      otpStore.set(email, record);

      return NextResponse.json({ message: "OTP verified" }, { status: 200 });
    }

    // ---- RESET PASSWORD ----
    if (action === "reset-password") {
      const { otp, newPassword } = body;
      const record = otpStore.get(email);

      if (!record || !record.verified || record.otp !== otp) {
        return NextResponse.json(
          { message: "OTP verification required before reset" },
          { status: 400 }
        );
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { message: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const user = await User.findOne({
        email: { $regex: `^${email}$`, $options: "i" },
      });
      if (!user) {
        return NextResponse.json(
          { message: "No account found with this email" },
          { status: 404 }
        );
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      await user.save();

      otpStore.delete(email);

      return NextResponse.json(
        { message: "Password successfully changed" },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error, please try again" },
      { status: 500 }
    );
  }
}