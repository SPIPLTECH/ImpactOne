"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

type StatusFilter = "" | "pending" | "approved" | "rejected";

// "" = All events
type EventTypeFilter =
  | ""
  | "student-session"
  | "parent-meeting"
  | "teacher-orientation"
  | "mom"
  | "parikshela-jata-jata"
  | "others";

const EVENT_TYPE_OPTIONS: { value: EventTypeFilter; label: string }[] = [
  { value: "", label: "All Events" },
  { value: "student-session", label: "Student Session" },
  { value: "parent-meeting", label: "Parent Meeting" },
  { value: "teacher-orientation", label: "Teacher Orientation" },
  { value: "mom", label: "MKCL Olympiad Movement" },
  { value: "parikshela-jata-jata", label: "Parikshela Jata Jata" },
  { value: "others", label: "Others" },
];

type ExportRow = {
  alcCode: string;
  alcCenterName: string;
  name: string;
  role: string;
  email: string;
  schoolName: string;
  eventName: string;
  checkinImageLink: string;
  eventVideoLink: string;
  date: string; // already formatted dd-mm-yyyy by the API
  time: string; // hh:mm AM/PM (IST)
};

const COLUMNS: { key: keyof ExportRow; label: string }[] = [
  { key: "alcCode", label: "ALC Code" },
  { key: "alcCenterName", label: "ALC Center name" },
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "email", label: "Email" },
  { key: "schoolName", label: "School Name" },
  { key: "eventName", label: "Event Name" },
  { key: "checkinImageLink", label: "Check in Image Link" },
  { key: "eventVideoLink", label: "Event Video Link" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
];

export default function ExportPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("");
  const [eventType, setEventType] = useState<EventTypeFilter>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<"csv" | "xlsx" | null>(null);

  function buildQuery(extra?: Record<string, string>) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (eventType) params.set("eventType", eventType);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    return params.toString();
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dcu/export?${buildQuery()}`);
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(data.rows || []);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, eventType, from, to, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDownload(format: "csv" | "xlsx") {
    setDownloadingFormat(format);
    try {
      const res = await fetch(`/api/dcu/export?${buildQuery({ format })}`);
      if (res.status === 401) return router.push("/admin/login");
      if (!res.ok) {
        alert("Failed to generate export. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dcu-export-${eventType || "all-events"}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingFormat(null);
    }
  }

  const linkCell = (url: string, label: string) =>
    url && url !== "-" ? (
      <a href={url} target="_blank" rel="noreferrer">
        {label}
      </a>
    ) : (
      "-"
    );

  return (
    <DcuShell title="Export Submissions" activeKey="export">
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {/* Event filter */}
        <label style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>Event:</label>
        <select
          className="field"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventTypeFilter)}
          style={{ maxWidth: 240, background: "#fff", color: "#222", border: "1px solid #ddd" }}
        >
          {EVENT_TYPE_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value} style={{ background: "#fff", color: "#222" }}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          className="field"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{ maxWidth: 160 }}
        />
        <span style={{ color: "#999" }}>to</span>
        <input
          type="date"
          className="field"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{ maxWidth: 160 }}
        />

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            className="btn-mini approve"
            onClick={() => handleDownload("xlsx")}
            disabled={downloadingFormat !== null || rows.length === 0}
          >
            {downloadingFormat === "xlsx" ? "Preparing..." : `Download Excel (${rows.length})`}
          </button>
          <button
            className="btn-mini"
            style={{ background: "#eee", color: "#333" }}
            onClick={() => handleDownload("csv")}
            disabled={downloadingFormat !== null || rows.length === 0}
          >
            {downloadingFormat === "csv" ? "Preparing..." : `Download CSV (${rows.length})`}
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {(["", "pending", "approved", "rejected"] as StatusFilter[]).map((st) => (
          <button
            key={st || "all"}
            className="btn-mini"
            style={{
              background: status === st ? "#e8003f" : "#eee",
              color: status === st ? "#fff" : "#333",
              textTransform: "capitalize",
            }}
            onClick={() => setStatus(st)}
          >
            {st || "All Status"}
          </button>
        ))}
      </div>

      <div className="admin-panel-block" style={{ overflowX: "auto" }}>
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && rows.length === 0 && <div className="empty-note">No submissions found for this filter.</div>}
        {!loading && rows.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.alcCode}</td>
                  <td>{r.alcCenterName}</td>
                  <td>{r.name}</td>
                  <td>{r.role}</td>
                  <td>{r.email}</td>
                  <td>{r.schoolName}</td>
                  <td>{r.eventName}</td>
                  <td>{linkCell(r.checkinImageLink, "View")}</td>
                  <td>{linkCell(r.eventVideoLink, "View")}</td>
                  <td>{r.date}</td>
                  <td>{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DcuShell>
  );
}