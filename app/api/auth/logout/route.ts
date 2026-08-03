import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set("io_session", "", { maxAge: 0, path: "/" });
  return res;
}
