"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

const EVENT_TYPES = [
  "student-session",
  "parent-meeting",
  "teacher-orientation",
  "mom",
  "parikshela-jata-jata",
  "others",
];
const STATUSES = ["pending", "approved", "rejected"];

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
const toInputDate = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default function AlcManager() {
  const router = useRouter();
  const [districts, setDistricts] = useState<string[]>([]);
  const [district, setDistrict] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groups, setGroups] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ kind: "event" | "checkin"; row: AnyRow } | null>(null);
  const [saving, setSaving] = useState(false);

  async function load(d = district) {
    setLoading(true);
    const params = new URLSearchParams();
    if (d) params.set("district", d);
    if (q.trim()) params.set("q", q.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetch(`/api/superadmin/alc-details?${params}`);
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setDistricts(data.districts || []);
      setGroups(data.groups || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!editing) return;
    const { kind, row } = editing;
    let body: AnyRow;
    if (kind === "event") {
      body = {
        eventType: row.eventType,
        classOfStudents: row.classOfStudents,
        specifyEvent: row.specifyEvent,
        instituteName: row.instituteName,
        presentCount: Number(row.presentCount) || 0,
        conductedAt: row.conductedAt,
        status: row.status,
        rejectReason: row.rejectReason,
        alcCenterName: row.alcCenterName,
        district: row.district,
      };
    } else {
      body = {
        instituteName: row.instituteName,
        status: row.status,
        rejectReason: row.rejectReason,
        alcCenterName: row.alcCenterName,
        district: row.district,
      };
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/superadmin/${kind === "event" ? "events" : "checkins"}/${row._id}`,
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (!res.ok) return alert("Save failed");
      const data = await res.json();
      const updated = kind === "event" ? data.event : data.checkin;
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          [kind === "event" ? "events" : "checkins"]: g[kind === "event" ? "events" : "checkins"].map(
            (r: AnyRow) => (r._id === updated._id ? updated : r)
          ),
        }))
      );
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function remove(kind: "event" | "checkin", id: string) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    const res = await fetch(`/api/superadmin/${kind === "event" ? "events" : "checkins"}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return alert("Delete failed");
    const key = kind === "event" ? "events" : "checkins";
    setGroups((prev) => prev.map((g) => ({ ...g, [key]: g[key].filter((r: AnyRow) => r._id !== id) })));
  }

  const set = (field: string, value: unknown) =>
    setEditing((e) => (e ? { ...e, row: { ...e.row, [field]: value } } : e));
  const input = { width: "100%", padding: 6, marginTop: 4 } as const;

  return (
    <div>
      <div className="admin-panel-block" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>ALC Details &amp; Events</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}
        >
          <label style={{ fontSize: 13 }}>
            District
            <select style={{ ...input, minWidth: 160 }} value={district} onChange={(e) => { setDistrict(e.target.value); load(e.target.value); }}>
              <option value="">-- Select district --</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            Search ALC center name
            <input style={{ ...input, minWidth: 220 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Center name / code / ALC name" />
          </label>
          <label style={{ fontSize: 13 }}>
            From
            <input type="date" style={input} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label style={{ fontSize: 13 }}>
            To
            <input type="date" style={input} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button className="btn-mini" type="submit" disabled={!district}>Search</button>
        </form>
      </div>

      {loading && <div className="empty-note">Loading...</div>}
      {!loading && !district && <div className="empty-note">Pehle district select karo.</div>}
      {!loading && district && groups.length === 0 && <div className="empty-note">Koi ALC nahi mila.</div>}

      {!loading &&
        groups.map((g) => (
          <div key={g.user._id} className="admin-panel-block" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 4 }}>{g.user.alcCenterName || g.user.fullName}</h3>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
              {g.user.fullName} · {g.user.role} · Code: {g.user.alcCenterCode || "-"} · {g.user.phone || "-"} · {g.user.status}
              {" · "}Check-ins: {g.checkins.length} · Events: {g.events.length}
            </div>

            <h4 style={{ margin: "8px 0" }}>Events</h4>
            {g.events.length === 0 ? (
              <div className="empty-note">No events.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Event</th><th>Class</th><th>Institute</th>
                    <th>Present</th><th>Status</th><th>Video</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {g.events.map((ev: AnyRow) => (
                    <tr key={ev._id}>
                      <td>{ev.conductedAt || fmtDate(ev.createdAt)}</td>
                      <td>{ev.eventType === "others" && ev.specifyEvent ? `others: ${ev.specifyEvent}` : ev.eventType}</td>
                      <td>{ev.classOfStudents || "-"}</td>
                      <td>{ev.instituteName}</td>
                      <td>{ev.presentCount}</td>
                      <td>{ev.status}</td>
                      <td>{ev.video?.url ? <a href={ev.video.url} target="_blank" rel="noreferrer">View</a> : "-"}</td>
                      <td>
                        <button className="btn-mini" style={{ marginRight: 6 }} onClick={() => setEditing({ kind: "event", row: { ...ev } })}>Edit</button>
                        <button className="btn-mini delete" onClick={() => remove("event", ev._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h4 style={{ margin: "16px 0 8px" }}>Check-ins</h4>
            {g.checkins.length === 0 ? (
              <div className="empty-note">No check-ins.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Institute</th><th>Status</th><th>Photo</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {g.checkins.map((c: AnyRow) => (
                    <tr key={c._id}>
                      <td>{fmtDate(c.createdAt)}</td>
                      <td>{c.instituteName}</td>
                      <td>{c.status}</td>
                      <td>{c.photoUrl ? <a href={c.photoUrl} target="_blank" rel="noreferrer">View</a> : "-"}</td>
                      <td>
                        <button className="btn-mini" style={{ marginRight: 6 }} onClick={() => setEditing({ kind: "checkin", row: { ...c } })}>Edit</button>
                        <button className="btn-mini delete" onClick={() => remove("checkin", c._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}

      {editing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setEditing(null)}
        >
          <div
            className="admin-panel-block"
            style={{ width: 420, maxHeight: "90vh", overflowY: "auto", background: "#fff", padding: 20, borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 12 }}>Edit {editing.kind === "event" ? "Event" : "Check-in"}</h3>

            <label style={{ display: "block", marginBottom: 8 }}>
              ALC Center Name
              <input style={input} value={editing.row.alcCenterName || ""} onChange={(e) => set("alcCenterName", e.target.value)} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              District
              <input style={input} value={editing.row.district || ""} onChange={(e) => set("district", e.target.value)} />
            </label>
            <label style={{ display: "block", marginBottom: 8 }}>
              Institute Name
              <input style={input} value={editing.row.instituteName || ""} onChange={(e) => set("instituteName", e.target.value)} />
            </label>

            {editing.kind === "event" && (
              <>
                <label style={{ display: "block", marginBottom: 8 }}>
                  Event Type
                  <select style={input} value={editing.row.eventType || ""} onChange={(e) => set("eventType", e.target.value)}>
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                {editing.row.eventType === "others" && (
                  <label style={{ display: "block", marginBottom: 8 }}>
                    Specify Event
                    <input style={input} value={editing.row.specifyEvent || ""} onChange={(e) => set("specifyEvent", e.target.value)} />
                  </label>
                )}
                <label style={{ display: "block", marginBottom: 8 }}>
                  Class of Students
                  <input style={input} value={editing.row.classOfStudents || ""} onChange={(e) => set("classOfStudents", e.target.value)} />
                </label>
                <label style={{ display: "block", marginBottom: 8 }}>
                  No. of Students Present
                  <input type="number" min={0} style={input} value={editing.row.presentCount ?? ""} onChange={(e) => set("presentCount", e.target.value)} />
                </label>
                <label style={{ display: "block", marginBottom: 8 }}>
                  Event Date (conductedAt)
                  <input type="date" style={input} value={toInputDate(editing.row.conductedAt) || editing.row.conductedAt || ""} onChange={(e) => set("conductedAt", e.target.value)} />
                </label>
              </>
            )}

            <label style={{ display: "block", marginBottom: 8 }}>
              Status
              <select style={input} value={editing.row.status || "pending"} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            {editing.row.status === "rejected" && (
              <label style={{ display: "block", marginBottom: 8 }}>
                Reject Reason
                <input style={input} value={editing.row.rejectReason || ""} onChange={(e) => set("rejectReason", e.target.value)} />
              </label>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button className="btn-mini" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-mini" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
