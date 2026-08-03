import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import User from "@/models/User";

/**
 * Uses your existing getSessionFromRequest() (same one /api/me uses) to
 * identify the caller, then loads the full user document from the DB so we
 * reliably have district/status/role regardless of what's stored in the
 * session payload itself.
 */
export async function requireDcuUser(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionId = (session as any).id || (session as any)._id;
  if (!sessionId) return null;

  const user = await User.findById(sessionId).lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = user as any;
  if (!u) return null;
  if (u.role !== "DCU") return null;
  if (u.status && u.status !== "approved") return null;

  return u;
}
