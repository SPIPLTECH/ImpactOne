import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ message: "Not logged in" }, { status: 401 });
  return NextResponse.json({ user: session }, { status: 200 });
}
