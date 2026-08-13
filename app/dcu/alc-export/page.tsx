"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

type StatusFilter = "" | "pending" | "approved" | "rejected";
type RoleFilter = "" | "ALC" | "Intern";

type AlcRow = {
  alcCode: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  alcCenterName: string;
  district: string;
  status: string;
  registeredDate: string;
};

const COLUMNS: { key: keyof AlcRow; label: string }[] = [
  { key: "alcCode", label: "ALC Code" },
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "alcCenterName", label: "ALC Center Name" },
  { key: "district", label: "District" },
  { key: "status", label: "Status" },
  { key: "registeredDate", label: "Registered Date" },
];

export default function AlcExportPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("");
  const [role, setRole] = useState<RoleFilter>("");
  const [rows, setRows] = useState<AlcRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<"csv" | "xlsx" | null>(null);

  function buildQuery(extra?: Record<string, string>) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (role) params.set("role", role);
    if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    return params.toString();
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dcu/alc-export?${buildQuery()}`);
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(data.rows || []);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, role, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDownload(format: "csv" | "xlsx") {
    setDownloadingFormat(format);
    try {
      const res = await fetch(`/api/dcu/alc-export?${buildQuery({ format })}`);
      if (res.status === 401) return router.push("/admin/login");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `alc-registrations-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingFormat(null);
    }
  }

  return (
    <DcuShell title="ALC/Intern Registration Export" activeKey="alc-export">
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
            {st || "All"}
          </button>
        ))}

        <select
          className="select-field"
          style={{ maxWidth: 160 }}
          value={role}
          onChange={(e) => setRole(e.target.value as RoleFilter)}
        >
          <option value="">All Roles</option>
          <option value="ALC">ALC</option>
          <option value="Intern">Intern</option>
        </select>

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

      <div className="admin-panel-block" style={{ overflowX: "auto" }}>
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && rows.length === 0 && <div className="empty-note">No registrations found for this filter.</div>}
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
                  <td>{r.name}</td>
                  <td>{r.role}</td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{r.alcCenterName}</td>
                  <td>{r.district}</td>
                  <td style={{ textTransform: "capitalize" }}>{r.status}</td>
                  <td>{r.registeredDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DcuShell>
  );
}