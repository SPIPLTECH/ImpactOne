"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function QueriesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"open" | "resolved">("open");
  const [respondTarget, setRespondTarget] = useState<AnyRow | null>(null);
  const [response, setResponse] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dcu/queries?status=${filter}`);
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(data.queries || []);
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    load();
  }, [load]);

  function openRespond(q: AnyRow) {
    setRespondTarget(q);
    setResponse(q.response || "");
  }

  async function submitResponse() {
    if (!respondTarget) return;
    if (!response.trim()) {
      alert("Please enter a response");
      return;
    }
    await fetch(`/api/dcu/queries/${respondTarget._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response, status: "resolved" }),
    });
    setRespondTarget(null);
    load();
  }

  return (
    <DcuShell title="Queries / Issues Raised" activeKey="queries">
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {(["open", "resolved"] as const).map((f) => (
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

      <div className="admin-panel-block">
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && rows.length === 0 && <div className="empty-note">No {filter} queries.</div>}
        {!loading && rows.map((q) => (
          <div key={q._id} className="admin-panel-block" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{q.alcUser?.fullName || q.alcUser?.username}</strong>{" "}
                <span style={{ color: "#888", fontSize: 12.5 }}>{new Date(q.createdAt).toLocaleString()}</span>
                <div style={{ marginTop: 6, fontWeight: 600 }}>{q.subject}</div>
                <div style={{ marginTop: 4, color: "#444" }}>{q.message}</div>
                {q.response && (
                  <div style={{ marginTop: 8, padding: 10, background: "#fdeeea", borderRadius: 8, fontSize: 13.5 }}>
                    <strong>DCU Response:</strong> {q.response}
                  </div>
                )}
              </div>
              {filter === "open" && (
                <button className="btn-mini approve" onClick={() => openRespond(q)}>Respond</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {respondTarget && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Respond to Query</h3>
            <div style={{ marginBottom: 8, color: "#666", fontSize: 13.5 }}>{respondTarget.message}</div>
            <textarea placeholder="Type your response..." value={response} onChange={(e) => setResponse(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setRespondTarget(null)}>Cancel</button>
              <button className="btn-mini approve" onClick={submitResponse}>Send Response</button>
            </div>
          </div>
        </div>
      )}
    </DcuShell>
  );
}
