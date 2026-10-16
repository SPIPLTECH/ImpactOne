import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import Checkin from "@/models/CheckIn";
import EventSubmission from "@/models/EventSubmission";
import User from "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";
import alcs from "@/data/alcs.json";

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/superadmin/alc-details?district=Nagpur&q=center name&from=2026-10-01&to=2026-10-31
// Returns, per ALC center in the district: its check-ins + event submissions
// (all statuses) so the SuperAdmin can view/edit them.
export async function GET(req: NextRequest) {
  await connectDB();
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "SuperAdmin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const district = (sp.get("district") || "").trim();
  const q = (sp.get("q") || "").trim();
  const from = sp.get("from");
  const to = sp.get("to");

  const dbDistricts: string[] = (await User.distinct("district")).filter(Boolean);
  const districts = Array.from(new Set([...Object.keys(alcs as object), ...dbDistricts])).sort();

  if (!district) {
    return NextResponse.json({ districts, groups: [] });
  }

  const userFilter: Record<string, unknown> = { district, role: { $in: ["ALC", "Intern"] } };
  if (q) {
    const rx = new RegExp(esc(q), "i");
    userFilter.$or = [{ alcCenterName: rx }, { fullName: rx }, { alcCenterCode: rx }];
  }
  const users = await User.find(userFilter).select("-password").sort({ alcCenterName: 1 }).lean();
  const ids = users.map((u: any) => u._id);

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.$gte = new Date(from + "T00:00:00.000Z");
  if (to) dateFilter.$lte = new Date(to + "T23:59:59.999Z");
  const hasDate = Object.keys(dateFilter).length > 0;

  const base: Record<string, unknown> = { alcUser: { $in: ids } };
  if (hasDate) base.createdAt = dateFilter;

  const [checkins, events] = await Promise.all([
    Checkin.find(base).sort({ createdAt: -1 }).lean(),
    EventSubmission.find(base).sort({ createdAt: -1 }).lean(),
  ]);

  const groups = users.map((u: any) => {
    const id = String(u._id);
    return {
      user: u,
      checkins: checkins.filter((c: any) => String(c.alcUser) === id),
      events: events.filter((e: any) => String(e.alcUser) === id),
    };
  });

  return NextResponse.json({ districts, groups });
}
