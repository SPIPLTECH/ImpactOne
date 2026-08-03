import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const SECRET = process.env.NEXTAUTH_SECRET || "dev_secret_change_me";

export type SessionPayload = {
  id: string;
  username: string;
  role: "ALC" | "Intern" | "Mentor" | "DCU" | "MRCU" | "SuperAdmin";
  district?: string;
  alcCenterCode?: string;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get("io_session")?.value;
  if (!token) return null;
  return verifySession(token);
}