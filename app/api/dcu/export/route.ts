import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import CheckIn from "@/models/CheckIn";
import EventSubmission from "@/models/EventSubmission";
import * as XLSX from "xlsx"; // npm install xlsx

// GET /api/dcu/export?status=approved&from=2025-01-01&to=2025-12-31&format=csv|xlsx
// Merges CheckIn + EventSubmission (scoped to the DCU admin's district).
// Rows from the SAME ALC + SAME School + SAME DAY are combined into a single
// row (one row per ALC/School/Date):
// ALC Code | ALC Center name | Name | Role | Email | School Name | Check in Image Link | Event Video Link | Date
//
// Links:
//  - .xlsx  -> real hyperlink object on the cell, cell text shows "Link", click opens the URL directly
//  - .csv   -> plain URL text (CSV has no native hyperlink concept; Excel/Sheets/Docs
//              auto-detect a bare http(s) URL and make it clickable when opened)

type ExportRow = {
  alcCode: string;
  alcCenterName: string;
  name: string;
  role: string;
  email: string;
  schoolName: string;
  checkinImageLink: string; // "-" or a real URL
  eventVideoLink: string; // "-" or a real URL
  date: string; // yyyy-mm-dd (day only, used for grouping + display)
};

const HEADER = [
  "ALC Code",
  "ALC Center name",
  "Name",
  "Role",
  "Email",
  "School Name",
  "Check in Image Link",
  "Event Video Link",
  "Date",
];

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dayStr: string) {
  if (dayStr === "-") return "-";
  const [y, m, d] = dayStr.split("-");
  return `${d}-${m}-${y}`; // dd-mm-yyyy
}

const isUrl = (v: string) => v !== "-" && /^https?:\/\//i.test(v);

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const dcu = await requireDcuUser(req);
    if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const status = req.nextUrl.searchParams.get("status") || "";
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const format = req.nextUrl.searchParams.get("format"); // "csv" | "xlsx" | null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { district: dcu.district };
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [checkins, events] = await Promise.all([
      CheckIn.find(filter)
        .populate("alcUser", "fullName username role email alcCenterName")
        .sort({ createdAt: -1 })
        .lean(),
      EventSubmission.find(filter)
        .populate("alcUser", "fullName username role email alcCenterName")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const groups = new Map<string, ExportRow>();

    function upsert(params: {
      alcCode: string;
      alcCenterName: string;
      name: string;
      role: string;
      email: string;
      schoolName: string;
      day: string;
      checkinLink?: string;
      eventLink?: string;
    }) {
      const key = `${params.alcCode}||${params.schoolName}||${params.day}`;
      const existing = groups.get(key);
      if (existing) {
        if (params.checkinLink && existing.checkinImageLink === "-") {
          existing.checkinImageLink = params.checkinLink;
        }
        if (params.eventLink && existing.eventVideoLink === "-") {
          existing.eventVideoLink = params.eventLink;
        }
        return;
      }
      groups.set(key, {
        alcCode: params.alcCode,
        alcCenterName: params.alcCenterName,
        name: params.name,
        role: params.role,
        email: params.email,
        schoolName: params.schoolName,
        checkinImageLink: params.checkinLink || "-",
        eventVideoLink: params.eventLink || "-",
        date: params.day,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkins.forEach((s: any) => {
      const day = s.createdAt ? dayKey(new Date(s.createdAt)) : "-";
      upsert({
        alcCode: s.alcUser?.username || "-",
        alcCenterName: s.alcUser?.alcCenterName || "-",
        name: s.alcUser?.fullName || s.alcUser?.username || "-",
        role: s.alcUser?.role || "-",
        email: s.alcUser?.email || "-",
        schoolName: s.instituteName || "-",
        day,
        checkinLink: s.photoUrl || undefined,
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events.forEach((ev: any) => {
      const day = ev.createdAt ? dayKey(new Date(ev.createdAt)) : "-";
      upsert({
        alcCode: ev.alcUser?.username || "-",
        alcCenterName: ev.alcUser?.alcCenterName || "-",
        name: ev.alcUser?.fullName || ev.alcUser?.username || "-",
        role: ev.alcUser?.role || "-",
        email: ev.alcUser?.email || "-",
        schoolName: ev.instituteName || "-",
        day,
        eventLink: ev.video?.url || ev.videos?.[0]?.url || undefined,
      });
    });

    const rows = Array.from(groups.values()).sort(
      (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
    );

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
            r.checkinImageLink, // plain URL, or "-"
            r.eventVideoLink, // plain URL, or "-"
            formatDisplayDate(r.date),
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
        isUrl(r.checkinImageLink) ? "Link" : "-",
        isUrl(r.eventVideoLink) ? "Link" : "-",
        formatDisplayDate(r.date),
      ]);

      const worksheetData = [HEADER, ...displayRows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      rows.forEach((r, i) => {
        const excelRow = i + 2; // header is row 1
        if (isUrl(r.checkinImageLink)) {
          const addr = `G${excelRow}`;
          worksheet[addr].l = { Target: r.checkinImageLink };
          worksheet[addr].s = {
            font: { color: { rgb: "FF0563C1" }, underline: true },
          };
        }
        if (isUrl(r.eventVideoLink)) {
          const addr = `H${excelRow}`;
          worksheet[addr].l = { Target: r.eventVideoLink };
          worksheet[addr].s = {
            font: { color: { rgb: "FF0563C1" }, underline: true },
          };
        }
      });

      worksheet["!cols"] = [
        { wch: 14 },
        { wch: 22 },
        { wch: 20 },
        { wch: 10 },
        { wch: 26 },
        { wch: 22 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
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

    const preview = rows.map((r) => ({ ...r, date: formatDisplayDate(r.date) }));
    return NextResponse.json({ rows: preview, count: preview.length });
  } catch (err) {
    console.error("DCU export error:", err);
    return NextResponse.json({ message: "Failed to generate export" }, { status: 500 });
  }
}