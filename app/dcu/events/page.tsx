"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

type StatusFilter = "pending" | "approved" | "rejected";
const EVENT_TYPES = ["student-session", "parent-meeting", "teacher-orientation"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function EventsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/dcu/events?status=${status}${eventTypeFilter ? `&eventType=${eventTypeFilter}` : ""}`;
      const res = await fetch(url);
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(data.events || []);
    } finally {
      setLoading(false);
    }
  }, [status, eventTypeFilter, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function approveEvent(id: string) {
    await fetch(`/api/dcu/events/${id}`, {
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
    await fetch(`/api/dcu/events/${rejectTarget}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reason }),
    });
    setRejectTarget(null);
    load();
  }

  return (
    <DcuShell title="Event Submissions" activeKey="events">
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
        <select className="select-field" style={{ maxWidth: 220 }} value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)}>
          <option value="">All Event Types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="admin-panel-block">
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && rows.length === 0 && <div className="empty-note">Nothing to show here.</div>}
        {!loading && rows.length > 0 && (
          <div>
            {rows.map((ev) => (
              <div key={ev._id} className="admin-panel-block" style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <strong>{ev.alcUser?.fullName || ev.alcUser?.username}</strong>{" "}
                    <span style={{ color: "#888" }}>({ev.instituteName})</span>
                    <div style={{ fontSize: 12.5, color: "#888" }}>
                      {ev.eventType}
                      {ev.classOfStudents ? ` · ${ev.classOfStudents}` : ""} · Present: {ev.presentCount} · {new Date(ev.createdAt).toLocaleString()}
                    </div>
                    {status === "rejected" && ev.rejectReason && (
                      <div style={{ fontSize: 12.5, color: "#c0392b", marginTop: 4 }}>Reason: {ev.rejectReason}</div>
                    )}
                  </div>
                  {status === "pending" && (
                    <div>
                      <button className="btn-mini approve" onClick={() => approveEvent(ev._id)}>Approve</button>
                      <button className="btn-mini reject" onClick={() => openReject(ev._id)}>Reject</button>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 10 }}>
                  {ev.video?.url ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={ev.video.url} controls style={{ width: "100%", maxWidth: 360, borderRadius: 8, background: "#000" }} />
                  ) : ev.videos?.[0]?.url ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={ev.videos[0].url} controls style={{ width: "100%", maxWidth: 360, borderRadius: 8, background: "#000" }} />
                  ) : (
                    <div style={{ fontSize: 12.5, color: "#c0392b" }}>No video found on this submission.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
