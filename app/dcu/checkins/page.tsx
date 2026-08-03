"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

type StatusFilter = "pending" | "approved" | "rejected";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function CheckinsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dcu/submissions?status=${status}`);
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(data.submissions || []);
    } finally {
      setLoading(false);
    }
  }, [status, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function approveSubmission(id: string) {
    await fetch(`/api/dcu/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    load();
  }

  function openReject(id: string) {
    setRejectTarget(id);
    setReason("");
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    if (!reason.trim()) {
      alert("Please enter a reason for rejection");
      return;
    }
    await fetch(`/api/dcu/submissions/${rejectTarget}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reason }),
    });
    setRejectTarget(null);
    load();
  }

  return (
    <DcuShell title="Check-in Submissions" activeKey="checkins">
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {(["pending", "approved", "rejected"] as StatusFilter[]).map((st) => (
          <button
            key={st}
            className="btn-mini"
            style={{ background: status === st ? "#e8003f" : "#eee", color: status === st ? "#fff" : "#333", textTransform: "capitalize" }}
            onClick={() => setStatus(st)}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="admin-panel-block">
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && rows.length === 0 && <div className="empty-note">Nothing to show here.</div>}
        {!loading && rows.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>ALC</th>
                <th>Institute</th>
                <th>Photo</th>
                <th>GPS</th>
                <th>Time</th>
                {status === "rejected" && <th>Reason</th>}
                {status === "pending" && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s._id}>
                  <td>{s.alcUser?.fullName || s.alcUser?.username}</td>
                  <td>{s.instituteName}</td>
                  <td><a href={s.photoUrl} target="_blank" rel="noreferrer">View</a></td>
                  <td>{s.gps?.lat?.toFixed(4)}, {s.gps?.lng?.toFixed(4)}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  {status === "rejected" && <td>{s.rejectReason || "-"}</td>}
                  {status === "pending" && (
                    <td>
                      <button className="btn-mini approve" onClick={() => approveSubmission(s._id)}>Approve</button>
                      <button className="btn-mini reject" onClick={() => openReject(s._id)}>Reject</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectTarget && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Why are you rejecting this?</h3>
            <textarea placeholder="Enter reason..." value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button className="btn-mini reject" onClick={confirmReject}>Reject &amp; Submit</button>
            </div>
          </div>
        </div>
      )}
    </DcuShell>
  );
}
