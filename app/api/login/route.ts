import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signSession } from "@/lib/auth";

const VALID_ROLES = ["Mentor", "MRCU", "DCU", "ALC"];

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, password, role } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ message: "Username, password and role are required" }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const user = await User.findOne({ username, role });
    if (!user) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 });
    }
    if (user.status === "pending") {
      return NextResponse.json(
        { message: "Your account is awaiting DCU approval" },
        { status: 403 }
      );
    }
    if (user.status === "rejected") {
      return NextResponse.json({ message: "Your account request was rejected" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 });
    }

    const token = signSession({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      district: user.district,
      alcCenterCode: user.alcCenterCode,
    });

    const res = NextResponse.json(
      {
        message: "Login successful",
        user: {
          username: user.username,
          role: user.role,
          district: user.district,
          alcCenterCode: user.alcCenterCode,
          alcCenterName: user.alcCenterName,
        },
      },
      { status: 200 }
    );
    res.cookies.set("io_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
