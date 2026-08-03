import EventSubmission from "@/models/EventSubmission";
import User from "@/models/User";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = any;

const REQUIRED_EVENT_TYPES = ["student-session", "parent-meeting", "teacher-orientation"];

export type SchoolRow = {
  instituteName: string;
  alcUserId: string;
  alcName: string;
  completedEventTypes: string[];
  doneCount: number;
  status: "completed" | "partial" | "pending";
};

export type AlcSummaryRow = {
  alcUserId: string;
  alcName: string;
  completed: number;
  partial: number;
  pending: number;
};

/**
 * Groups every APPROVED EventSubmission by (alcUser + instituteName). A
 * school counts as "completed" once all 3 required event types
 * (student-session, teacher-orientation, parent-meeting) have at least one
 * approved submission for that institute.
 *
 * NOTE: app/api/event/capture/route.ts computes a per-submission "weight"
 * (e.g. a combined "8th/9th/10th" student session = 3) intended for a
 * weighted completion count, but EventSubmissionSchema does not currently
 * declare a `weight` field, so Mongoose silently drops it on save. This
 * function only relies on fields that are actually persisted
 * (eventType/instituteName/status), so it works correctly today. If you add
 * `weight: Number` to EventSubmissionSchema, tell me and I'll switch this to
 * a weighted-sum completion count instead of "3 distinct types".
 */
export async function computeSchoolStats(district?: string): Promise<{
  schools: SchoolRow[];
  alcSummary: AlcSummaryRow[];
  completedCountByAlc: Record<string, number>;
}> {
  const filter: AnyDoc = { status: "approved" };
  if (district) filter.district = district;

  const events = await EventSubmission.find(filter).select("alcUser instituteName eventType").lean();

  const users = await User.find(district ? { district } : {})
    .select("fullName username role")
    .lean();
  const userMap: Record<string, AnyDoc> = {};
  users.forEach((u: AnyDoc) => (userMap[String(u._id)] = u));

  // key = `${alcUser}::${instituteName}`
  const grouped: Record<string, { alcUserId: string; instituteName: string; types: Set<string> }> = {};

  for (const ev of events) {
    if (!ev.instituteName || !ev.alcUser) continue;
    const key = `${ev.alcUser}::${ev.instituteName}`;
    if (!grouped[key]) {
      grouped[key] = { alcUserId: String(ev.alcUser), instituteName: ev.instituteName, types: new Set() };
    }
    grouped[key].types.add(ev.eventType);
  }

  const schools: SchoolRow[] = Object.values(grouped).map((g) => {
    const doneCount = g.types.size;
    const status: SchoolRow["status"] =
      doneCount >= REQUIRED_EVENT_TYPES.length ? "completed" : doneCount > 0 ? "partial" : "pending";
    const alcUser = userMap[g.alcUserId];
    return {
      instituteName: g.instituteName,
      alcUserId: g.alcUserId,
      alcName: alcUser?.fullName || alcUser?.username || "Unknown",
      completedEventTypes: Array.from(g.types),
      doneCount,
      status,
    };
  });

  const summaryMap: Record<string, AlcSummaryRow> = {};
  for (const s of schools) {
    if (!summaryMap[s.alcUserId]) {
      const alcUser = userMap[s.alcUserId];
      summaryMap[s.alcUserId] = {
        alcUserId: s.alcUserId,
        alcName: alcUser?.fullName || alcUser?.username || "Unknown",
        completed: 0,
        partial: 0,
        pending: 0,
      };
    }
    if (s.status === "completed") summaryMap[s.alcUserId].completed += 1;
    else if (s.status === "partial") summaryMap[s.alcUserId].partial += 1;
    else summaryMap[s.alcUserId].pending += 1;
  }

  const completedCountByAlc: Record<string, number> = {};
  Object.values(summaryMap).forEach((row) => {
    completedCountByAlc[row.alcUserId] = row.completed;
  });

  return { schools, alcSummary: Object.values(summaryMap), completedCountByAlc };
}
