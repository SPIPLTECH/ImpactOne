import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, password, role, district } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ message: "Username, password and role are required" }, { status: 400 });
    }
    if (role === "DCU" && !district) {
      return NextResponse.json({ message: "Please select your district" }, { status: 400 });
    }

    const query: Record<string, string> = { username, role };
    if (role === "DCU") query.district = district;

    const user = await User.findOne(query);
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = signSession({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      district: user.district,
    });

    const res = NextResponse.json(
      { message: "Login successful", admin: { username: user.username, role: user.role, district: user.district } },
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
