import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Checkin from "@/models/CheckIn";
import { getSessionFromRequest } from "@/lib/auth";
import { uploadBase64 } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    if (!session || session.role !== "ALC") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { district, alc, instituteName, gps, photo } = body;

    if (!district || !alc || !instituteName || !gps || !photo) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const photoUrl = await uploadBase64(photo, "impactone/checkins");

    const checkin = await Checkin.create({
      alcUser: session.id,
      district,
      alcCenterCode: alc,
      instituteName,
      photoUrl,
      gps,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Check-in submitted successfully", id: checkin._id },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error, please try again" }, { status: 500 });
  }
}
