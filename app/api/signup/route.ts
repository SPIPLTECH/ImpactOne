import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import alcData from "@/data/alcs.json";

const ALCS: Record<string, { code: string; name: string }[]> = alcData as Record<
  string,
  { code: string; name: string }[]
>;

// Maps the first 4 digits of the MKCL email to a district
const MKCL_PREFIX_DISTRICT: Record<string, string> = {
  "1421": "Nagpur",
  "2421": "Wardha",
  "3421": "Chandrapur",
  "4421": "Bhandara",
  "5421": "Gondiya",
  "6421": "Gadchiroli",
};

const MKCL_EMAIL_REGEX = /^(\d{8})@mkcl\.org$/i;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { fullName, email, phone, username, password, district, alcCenter, role } = body;

    if (!fullName || !email || !phone || !username || !password || !role || !district) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const match = String(email).trim().match(MKCL_EMAIL_REGEX);
    if (!match) {
      return NextResponse.json(
        { message: "Email must be in the format ________@mkcl.org (8 digits before @mkcl.org)" },
        { status: 400 }
      );
    }

    const prefix = match[1].slice(0, 4);
    const expectedDistrict = MKCL_PREFIX_DISTRICT[prefix];
    if (!expectedDistrict || expectedDistrict !== district) {
      return NextResponse.json({ message: "Email code does not match the selected district" }, { status: 400 });
    }

    if (!Object.keys(ALCS).includes(district)) {
      return NextResponse.json({ message: "Invalid district" }, { status: 400 });
    }
    if (role === "ALC") {
      const validCenter = ALCS[district]?.some((c) => c.code === alcCenter);
      if (!validCenter) {
        return NextResponse.json({ message: "Invalid ALC center for district" }, { status: 400 });
      }
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ message: "Username already taken" }, { status: 409 });
    }

    const centerName = ALCS[district]?.find((c) => c.code === alcCenter)?.name || "";
    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      phone,
      username,
      password: hashed,
      role,
      district,
      alcCenterCode: alcCenter,
      alcCenterName: centerName,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Account creation request submitted. You'll receive a mail once your DCU approves." },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}