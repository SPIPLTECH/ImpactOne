import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// Zero dependencies on purpose — this only tells us whether the /api/dcu/*
// route tree itself is reachable at all, with nothing else in the way.
export async function GET() {
  return NextResponse.json({ ok: true, message: "test-ping route is reachable" });
}