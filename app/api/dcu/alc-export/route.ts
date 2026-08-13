import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireDcuUser } from "@/lib/dcuAuth";
import User from "@/models/User";
import * as XLSX from "xlsx"; // npm install xlsx

// GET /api/dcu/alc-export?status=approved&format=csv|xlsx
// Exports ALC/Intern registration data (User model) for the DCU admin's district:
// ALC Code | Name | Role | Email | Phone | ALC Center Name | District | Status | Registered Date

const HEADER = [
  "ALC Code",
  "Name",
  "Role",
  "Email",
  "Phone",
  "ALC Center Name",
  "District",
  "Status",
  "Registered Date",
];

function formatDisplayDate(d?: Date | string) {
  if (!d) return "-";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const dcu = await requireDcuUser(req);
    if (!dcu) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const status = req.nextUrl.searchParams.get("status") || ""; // "", pending, approved, rejected
    const role = req.nextUrl.searchParams.get("role") || ""; // "", ALC, Intern
    const format = req.nextUrl.searchParams.get("format"); // "csv" | "xlsx" | null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { district: dcu.district, role: { $in: ["ALC", "Intern"] } };
    if (status) filter.status = status;
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .sort({ fullName: 1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = users.map((u: any) => ({
      alcCode: u.username || "-",
      name: u.fullName || "-",
      role: u.role || "-",
      email: u.email || "-",
      phone: u.phone || "-",
      alcCenterName: u.alcCenterName || "-",
      district: u.district || "-",
      status: u.status || "-",
      registeredDate: formatDisplayDate(u.createdAt),
    }));

    const toDisplayRow = (r: (typeof rows)[number]) => [
      r.alcCode,
      r.name,
      r.role,
      r.email,
      r.phone,
      r.alcCenterName,
      r.district,
      r.status,
      r.registeredDate,
    ];

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
        ...rows.map((r) => toDisplayRow(r).map(escapeCsv).join(",")),
      ];

      const csv = "\uFEFF" + lines.join("\n"); // BOM for correct UTF-8 in Excel
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="alc-registrations-${Date.now()}.csv"`,
        },
      });
    }

    // ---------- Excel (.xlsx) ----------
    if (format === "xlsx") {
      const worksheetData = [HEADER, ...rows.map(toDisplayRow)];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      worksheet["!cols"] = [
        { wch: 14 }, // ALC Code
        { wch: 22 }, // Name
        { wch: 10 }, // Role
        { wch: 26 }, // Email
        { wch: 14 }, // Phone
        { wch: 24 }, // ALC Center Name
        { wch: 16 }, // District
        { wch: 12 }, // Status
        { wch: 14 }, // Registered Date
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ALC Registrations");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="alc-registrations-${Date.now()}.xlsx"`,
        },
      });
    }

    // ---------- JSON preview (default) ----------
    return NextResponse.json({ rows, count: rows.length });
  } catch (err) {
    console.error("ALC registration export error:", err);
    return NextResponse.json({ message: "Failed to generate export" }, { status: 500 });
  }
}