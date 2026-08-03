"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<AnyRow[]>([]);
  const [alcSummary, setAlcSummary] = useState<AnyRow[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "partial" | "pending">("all");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dcu/schools");
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setSchools(data.schools || []);
      setAlcSummary(data.alcSummary || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter === "all" ? schools : schools.filter((s) => s.status === filter);

  return (
    <DcuShell title="School Completion" activeKey="schools">
      {loading && <div className="empty-note">Loading...</div>}

      {!loading && (
        <>
          <h3 style={{ marginBottom: 12 }}>ALC-wise Summary</h3>
          <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
            {alcSummary.map((a) => (
              <div className="admin-stat-card" key={a.alcUserId}>
                <div className="label">{a.alcName}</div>
                <div className="value">{a.completed}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                  Completed · Partial: {a.partial} · Pending: {a.pending}
                </div>
              </div>
            ))}
            {alcSummary.length === 0 && <div className="empty-note">No data yet.</div>}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {(["all", "completed", "partial", "pending"] as const).map((f) => (
              <button
                key={f}
                className="btn-mini"
                style={{ background: filter === f ? "#e8003f" : "#eee", color: filter === f ? "#fff" : "#333", textTransform: "capitalize" }}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 && <div className="empty-note">Nothing to show here.</div>}
          {filtered.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>School / Institute</th>
                  <th>ALC</th>
                  <th>Events Approved</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i}>
                    <td>{s.instituteName}</td>
                    <td>{s.alcName}</td>
                    <td>{s.completedEventTypes.join(", ") || "-"} ({s.doneCount}/3)</td>
                    <td style={{ textTransform: "capitalize" }}>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </DcuShell>
  );
}
