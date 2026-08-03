"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DISTRICTS = ["Nagpur", "Wardha", "Chandrapur", "Bhandara", "Gondiya", "Gadchiroli"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

type Analytics = {
  schoolsCovered: number;
  studentSessions: number;
  teacherOrientations: number;
  parentMeetings: number;
  studentsImpacted: number;
  teachersImpacted: number;
  parentsImpacted: number;
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#fff4e0", text: "#a3690a" },
    approved: { bg: "#e3f7e8", text: "#1e7d34" },
    rejected: { bg: "#fdeaea", text: "#c0392b" },
  };
  const c = colors[status] || { bg: "#eee", text: "#555" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "capitalize",
        background: c.bg,
        color: c.text,
      }}
    >
      {status}
    </span>
  );
}

function DistrictWiseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDistrict = searchParams.get("district") || "";

  const [district, setDistrict] = useState(initialDistrict);
  const [tab, setTab] = useState<"analytics" | "checkins" | "events">("analytics");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [checkins, setCheckins] = useState<AnyRow[]>([]);
  const [events, setEvents] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!district) return;
    setLoading(true);
    setError("");
    fetch(`/api/mrcu/district?district=${encodeURIComponent(district)}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          throw new Error("unauth");
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");
        return data;
      })
      .then((data) => {
        setAnalytics(data.analytics);
        setCheckins(data.checkins || []);
        setEvents(data.events || []);
      })
      .catch((err) => {
        if (err.message !== "unauth") setError(err.message || "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [district, router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const analyticsCards = useMemo(() => {
    const a = analytics || {
      schoolsCovered: 0,
      studentSessions: 0,
      teacherOrientations: 0,
      parentMeetings: 0,
      studentsImpacted: 0,
      teachersImpacted: 0,
      parentsImpacted: 0,
    };
    return [
      { label: "Schools Covered", value: a.schoolsCovered },
      { label: "Student Sessions", value: a.studentSessions },
      { label: "Teacher Orientations", value: a.teacherOrientations },
      { label: "Parent Meetings", value: a.parentMeetings },
      { label: "Students Impacted", value: a.studentsImpacted },
      { label: "Teachers Impacted", value: a.teachersImpacted },
      { label: "Parents Impacted", value: a.parentsImpacted },
    ];
  }, [analytics]);

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          MRCU <span>Admin</span>
        </div>
        <a className="admin-nav-item" onClick={() => router.push("/mrcu/dashboard")}>
          Combined Dashboard
        </a>
        <a className="admin-nav-item active" onClick={() => router.push("/mrcu/district-wise")}>
          District-wise
        </a>
        <a className="admin-nav-item" onClick={handleLogout}>
          Logout
        </a>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>District-wise — {district || "Choose a district"}</h1>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {DISTRICTS.map((d) => (
            <button
              key={d}
              className="btn-mini"
              style={{
                background: district === d ? "#e8003f" : "#eee",
                color: district === d ? "#fff" : "#333",
              }}
              onClick={() => {
                setDistrict(d);
                setTab("analytics");
                router.replace(`/mrcu/district-wise?district=${encodeURIComponent(d)}`);
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {!district && <div className="empty-note">Choose a district above to see its analytics.</div>}

        {district && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {(["analytics", "checkins", "events"] as const).map((t) => (
                <button
                  key={t}
                  className="btn-mini"
                  style={{ background: tab === t ? "#e8003f" : "#eee", color: tab === t ? "#fff" : "#333", textTransform: "capitalize" }}
                  onClick={() => setTab(t)}
                >
                  {t === "checkins" ? "Check-in Submissions" : t === "events" ? "Event Submissions" : "Analytics"}
                </button>
              ))}
            </div>

            {loading && <div className="empty-note">Loading...</div>}
            {error && <div className="error-text">{error}</div>}

            {!loading && !error && tab === "analytics" && (
              <div className="admin-stat-grid">
                {analyticsCards.map((c) => (
                  <div className="admin-stat-card" key={c.label}>
                    <div className="value">{c.value}</div>
                    <div className="label">{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && tab === "checkins" && (
              <div className="admin-panel-block">
                {checkins.length === 0 && <div className="empty-note">No approved check-ins yet.</div>}
                {checkins.length > 0 && (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ALC / Intern</th>
                        <th>Institute</th>
                        <th>Photo</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkins.map((c) => (
                        <tr key={c._id}>
                          <td>{c.alcUser?.fullName || c.alcUser?.username}</td>
                          <td>{c.instituteName}</td>
                          <td>
                            <a href={c.photoUrl} target="_blank" rel="noreferrer">View</a>
                          </td>
                          <td>{new Date(c.createdAt).toLocaleString()}</td>
                          <td><StatusBadge status={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {!loading && !error && tab === "events" && (
              <div>
                {events.length === 0 && <div className="empty-note">No approved event submissions yet.</div>}
                {events.map((ev) => (
                  <div key={ev._id} className="admin-panel-block" style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <strong>{ev.alcUser?.fullName || ev.alcUser?.username}</strong>
                        <div style={{ fontSize: 12.5, color: "#888" }}>
                          {ev.eventType}
                          {ev.classOfStudents ? ` · ${ev.classOfStudents}` : ""} · Present: {ev.presentCount} ·{" "}
                          {new Date(ev.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <StatusBadge status={ev.status} />
                    </div>
                    {ev.video?.url && (
                      <div style={{ marginTop: 10 }}>
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video src={ev.video.url} controls style={{ width: "100%", maxWidth: 360, borderRadius: 8, background: "#000" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function DistrictWisePage() {
  return (
    <Suspense fallback={<div className="empty-note">Loading...</div>}>
      <DistrictWiseInner />
    </Suspense>
  );
}