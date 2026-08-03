import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import Query from "@/models/Query";

export async function GET(req: NextRequest) {
  await connectDB();
  const dcu = await requireDcuUser(req);
  if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "open";

  const queries = await Query.find({ district: dcu.district, status })
    .populate("alcUserId", "fullName username")
    .sort({ createdAt: -1 })
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaped = queries.map((q: any) => ({ ...q, alcUser: q.alcUserId }));

  return NextResponse.json({ queries: shaped });
}
