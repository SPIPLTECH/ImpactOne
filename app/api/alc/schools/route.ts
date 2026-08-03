import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import Checkin from "@/models/CheckIn";
import { getSessionFromRequest } from "@/lib/auth";

// Returns the distinct school/institute names this ALC/Intern has previously
// checked into — used to populate the "choose or add new school" dropdown so
// they don't have to retype the name every visit.
export async function GET(req: NextRequest) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || (session.role !== "ALC" && session.role !== "Intern")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const schools = await Checkin.distinct("instituteName", { alcUser: session.id });
  return NextResponse.json({ schools: schools.filter(Boolean).sort() }, { status: 200 });
}