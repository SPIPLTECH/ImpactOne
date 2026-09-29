import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import CheckIn from "@/models/CheckIn";
import EventSubmission from "@/models/EventSubmission";
import * as XLSX from "xlsx"; // npm install xlsx

// GET /api/dcu/export?status=approved&eventType=parent-meeting&from=2025-01-01&to=2025-12-31&format=csv|xlsx
//
// Scoped to the logged-in DCU's district.
//
// ROW LOGIC (one row per EVENT submitted by an ALC/Intern):
//   - Every EventSubmission = one row, with its "Event Name".
//   - The Check-in photo of the SAME ALC + SAME School + SAME Day is attached
//     to that row (so both the check-in and the event open from one row).
//   - When eventType filter = "" (All events), check-ins that have NO event on
//     that day are also listed (Event Name = "-") so nothing is lost.
//   - When an eventType filter is chosen (e.g. parent-meeting) only that
//     event's rows are exported.
//
// COLUMNS:
//   ALC Code | ALC Center name | Name | Role | Email | School Name |
//   Event Name | Check in Image Link | Event Video Link | Date | Time
//
// Links:
//  - .xlsx -> real clickable hyperlinks (click opens the photo / video directly)
//  - .csv  -> plain https URL text (Excel/Sheets auto-detect them)

type ExportRow = {
  alcCode: string;
  alcCenterName: string;
  name: string;
  role: string;
  email: string;
  schoolName: string;
  eventName: string; // "-" for check-in only rows
  checkinImageLink: string; // "-" or a real URL
  eventVideoLink: string; // "-" or a real URL
  date: string; // yyyy-mm-dd (IST) — used for sorting + matching
  time: string; // hh:mm AM/PM (IST)
  sortTs: number;
};

const HEADER = [
  "ALC Code",
  "ALC Center name",
  "Name",
  "Role",
  "Email",
  "School Name",
  "Event Name",
  "Check in Image Link",
  "Event Video Link",
  "Date",
  "Time",
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  "student-session": "Student Session",
  "parent-meeting": "Parent Meeting",
  "teacher-orientation": "Teacher Orientation",
  mom: "MKCL Olympiad Movement",
  "parikshela-jata-jata": "Parikshela Jata Jata",
  others: "Others",
};

const VALID_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);

const TZ = "Asia/Kolkata";

// ---- IST date / time helpers (server may run in UTC, so never use getHours()) ----
function dayKey(d: Date) {
  // en-CA gives yyyy-mm-dd
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function timeKey(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .toUpperCase();
}

function formatDisplayDate(dayStr: string) {
  if (!dayStr || dayStr === "-") return "-";
  const [y, m, d] = dayStr.split("-");
  return `${d}-${m}-${y}`; // dd-mm-yyyy
}

// ---- URL helpers: make sure only valid, clickable absolute URLs go to Excel ----
function cleanUrl(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  let u = raw.trim();
  if (!u) return undefined;
  if (u.startsWith("//")) u = "https:" + u;
  if (/^http:\/\//i.test(u)) u = u.replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(u)) return undefined;
  try {
    return new URL(u).toString(); // validates + encodes spaces etc.
  } catch {
    return undefined;
  }
}

const isUrl = (v: string) => v !== "-" && /^https?:\/\//i.test(v);

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

// Pretty event name shown in the "Event Name" column
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEventName(ev: any): string {
  const type = String(ev.eventType || "");
  const base = EVENT_TYPE_LABELS[type] || type || "-";

  if (type === "others") {
    const spec = String(ev.specifyEvent || "").trim();
    return spec ? `Others - ${spec}` : "Others";
  }
  if (type === "student-session") {
    const cls = String(ev.classOfStudents || "").trim();
    return cls ? `${base} (${cls})` : base;
  }
  if (type === "teacher-orientation" || type === "parent-meeting") {
    const st = String(ev.sessionType || "").trim();
    if (st.includes("+")) return st; // e.g. "Parent Meeting + Teacher Orientation"
  }
  return base;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const dcu = await requireDcuUser(req);
    if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const status = req.nextUrl.searchParams.get("status") || "";
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const format = req.nextUrl.searchParams.get("format"); // "csv" | "xlsx" | null
    const eventType = req.nextUrl.searchParams.get("eventType") || ""; // "" = all events

    if (eventType && !VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ message: "Invalid eventType" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { district: dcu.district };
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00+05:30`);
      if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999+05:30`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventFilter: any = { ...filter };
    if (eventType) eventFilter.eventType = eventType;

    const [checkins, events] = await Promise.all([
      CheckIn.find(filter)
        .populate("alcUser", "fullName username role email alcCenterName")
        .sort({ createdAt: -1 })
        .lean(),
      EventSubmission.find(eventFilter)
        .populate("alcUser", "fullName username role email alcCenterName")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // ---- index check-ins by ALC + School + Day (latest first because of sort) ----
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkinIndex = new Map<string, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkins.forEach((c: any) => {
      if (!c.createdAt) return;
      const alcId = String(c.alcUser?._id || c.alcUser || "");
      const key = `${alcId}||${norm(c.instituteName)}||${dayKey(new Date(c.createdAt))}`;
      if (!checkinIndex.has(key)) checkinIndex.set(key, c);
    });
    const usedCheckinKeys = new Set<string>();

    const rows: ExportRow[] = [];

    // ---- 1) one row per EVENT ----
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events.forEach((ev: any) => {
      const created = ev.createdAt ? new Date(ev.createdAt) : null;
      const day = created ? dayKey(created) : "-";
      const alcId = String(ev.alcUser?._id || ev.alcUser || "");
      const key = `${alcId}||${norm(ev.instituteName)}||${day}`;
      const ci = checkinIndex.get(key);
      if (ci) usedCheckinKeys.add(key);

      rows.push({
        alcCode: ev.alcUser?.username || ev.alcCenterCode || "-",
        alcCenterName: ev.alcUser?.alcCenterName || ev.alcCenterName || "-",
        name: ev.alcUser?.fullName || ev.alcUser?.username || "-",
        role: ev.alcUser?.role || "-",
        email: ev.alcUser?.email || "-",
        schoolName: ev.instituteName || "-",
        eventName: buildEventName(ev),
        checkinImageLink: cleanUrl(ci?.photoUrl) || "-",
        eventVideoLink: cleanUrl(ev.video?.url) || cleanUrl(ev.videos?.[0]?.url) || "-",
        date: day,
        time: created ? timeKey(created) : "-",
        sortTs: created ? created.getTime() : 0,
      });
    });

    // ---- 2) check-ins that had no event that day (only when ALL events selected) ----
    if (!eventType) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      checkinIndex.forEach((c: any, key: string) => {
        if (usedCheckinKeys.has(key)) return;
        const created = new Date(c.createdAt);
        rows.push({
          alcCode: c.alcUser?.username || c.alcCenterCode || "-",
          alcCenterName: c.alcUser?.alcCenterName || c.alcCenterName || "-",
          name: c.alcUser?.fullName || c.alcUser?.username || "-",
          role: c.alcUser?.role || "-",
          email: c.alcUser?.email || "-",
          schoolName: c.instituteName || "-",
          eventName: "-",
          checkinImageLink: cleanUrl(c.photoUrl) || "-",
          eventVideoLink: "-",
          date: dayKey(created),
          time: timeKey(created),
          sortTs: created.getTime(),
        });
      });
    }

    rows.sort((a, b) => b.sortTs - a.sortTs); // newest first

    // ---------- CSV ----------
    if (format === "csv") {
      const escapeCsv = (val: string) => {
        const s = String(val ?? "-");
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const lines = [
        HEADER.join(","),
        ...rows.map((r) =>
          [
            r.alcCode,
            r.alcCenterName,
            r.name,
            r.role,
            r.email,
            r.schoolName,
            r.eventName,
            r.checkinImageLink, // plain URL, or "-"
            r.eventVideoLink, // plain URL, or "-"
            formatDisplayDate(r.date),
            r.time,
          ]
            .map(escapeCsv)
            .join(",")
        ),
      ];

      const csv = "\uFEFF" + lines.join("\n"); // BOM so Excel reads UTF-8 correctly
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="dcu-export-${Date.now()}.csv"`,
        },
      });
    }

    // ---------- Excel (.xlsx) — real clickable hyperlinks ----------
    if (format === "xlsx") {
      const displayRows = rows.map((r) => [
        r.alcCode,
        r.alcCenterName,
        r.name,
        r.role,
        r.email,
        r.schoolName,
        r.eventName,
        isUrl(r.checkinImageLink) ? "View Check-in" : "-",
        isUrl(r.eventVideoLink) ? "View Event Video" : "-",
        formatDisplayDate(r.date),
        r.time,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([HEADER, ...displayRows]);

      const LINK_STYLE = { font: { color: { rgb: "FF0563C1" }, underline: true } };

      rows.forEach((r, i) => {
        const excelRow = i + 2; // header is row 1
        if (isUrl(r.checkinImageLink)) {
          const cell = worksheet[`H${excelRow}`];
          cell.l = { Target: r.checkinImageLink, Tooltip: "Open check-in photo" };
          cell.s = LINK_STYLE;
        }
        if (isUrl(r.eventVideoLink)) {
          const cell = worksheet[`I${excelRow}`];
          cell.l = { Target: r.eventVideoLink, Tooltip: "Open event video" };
          cell.s = LINK_STYLE;
        }
      });

      worksheet["!cols"] = [
        { wch: 14 }, // ALC Code
        { wch: 24 }, // ALC Center name
        { wch: 22 }, // Name
        { wch: 10 }, // Role
        { wch: 28 }, // Email
        { wch: 26 }, // School Name
        { wch: 30 }, // Event Name
        { wch: 16 }, // Check in Image Link
        { wch: 18 }, // Event Video Link
        { wch: 12 }, // Date
        { wch: 10 }, // Time
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

      const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
        cellStyles: true,
      });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="dcu-export-${Date.now()}.xlsx"`,
        },
      });
    }

    // ---------- JSON preview for the dashboard table ----------
    const preview = rows.map((r) => ({
      alcCode: r.alcCode,
      alcCenterName: r.alcCenterName,
      name: r.name,
      role: r.role,
      email: r.email,
      schoolName: r.schoolName,
      eventName: r.eventName,
      checkinImageLink: r.checkinImageLink,
      eventVideoLink: r.eventVideoLink,
      date: formatDisplayDate(r.date),
      time: r.time,
    }));
    return NextResponse.json({ rows: preview, count: preview.length });
  } catch (err) {
    console.error("DCU export error:", err);
    return NextResponse.json({ message: "Failed to generate export" }, { status: 500 });
  }
}