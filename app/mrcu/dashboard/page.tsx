"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Totals = {
  schoolsCovered: number;
  studentSessions: number;
  teacherOrientations: number;
  parentMeetings: number;
  studentsImpacted: number;
  teachersImpacted: number;
  parentsImpacted: number;
};

type DistrictRow = Totals & { district: string };

export default function MrcuDashboardPage() {
  const router = useRouter();
  const [combined, setCombined] = useState<Totals | null>(null);
  const [perDistrict, setPerDistrict] = useState<DistrictRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/mrcu/overview")
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
        setCombined(data.combined);
        setPerDistrict(data.perDistrict || []);
      })
      .catch((err) => {
        if (err.message !== "unauth") setError(err.message || "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const t = combined || {
    schoolsCovered: 0,
    studentSessions: 0,
    teacherOrientations: 0,
    parentMeetings: 0,
    studentsImpacted: 0,
    teachersImpacted: 0,
    parentsImpacted: 0,
  };

  const topCards = [
    { label: "Total Schools Covered (All Districts)", value: t.schoolsCovered },
    { label: "Total Student Sessions (All Districts)", value: t.studentSessions },
    { label: "Total Parent Meetings (All Districts)", value: t.parentMeetings },
    { label: "Total Teacher Orientations (All Districts)", value: t.teacherOrientations },
  ];

  const impactCards = [
    { label: "Total Students Impacted", value: t.studentsImpacted },
    { label: "Total Teachers Impacted", value: t.teachersImpacted },
    { label: "Total Parents Impacted", value: t.parentsImpacted },
  ];

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          MRCU <span>Admin</span>
        </div>
        <a className="admin-nav-item active" onClick={() => router.push("/mrcu/dashboard")}>
          Combined Dashboard
        </a>
        <a className="admin-nav-item" onClick={() => router.push("/mrcu/district-wise")}>
          District-wise
        </a>
        <a className="admin-nav-item" onClick={handleLogout}>
          Logout
        </a>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>MRCU Dashboard — All Districts</h1>
        </div>

        {loading && <div className="empty-note">Loading...</div>}
        {error && <div className="error-text">{error}</div>}

        {!loading && !error && (
          <>
            <h3 style={{ marginBottom: 14 }}>Overview (DCU-approved only)</h3>
            <div className="admin-stat-grid" style={{ marginBottom: 18 }}>
              {topCards.map((c) => (
                <div className="admin-stat-card" key={c.label}>
                  <div className="value">{c.value}</div>
                  <div className="label">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="admin-stat-grid" style={{ marginBottom: 28 }}>
              {impactCards.map((c) => (
                <div className="admin-stat-card" key={c.label}>
                  <div className="value">{c.value}</div>
                  <div className="label">{c.label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: 14 }}>District-wise Breakdown</h3>
            <div className="admin-panel-block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Schools Covered</th>
                    <th>Student Sessions</th>
                    <th>Teacher Orientations</th>
                    <th>Parent Meetings</th>
                    <th>Students Impacted</th>
                    <th>Teachers Impacted</th>
                    <th>Parents Impacted</th>
                  </tr>
                </thead>
                <tbody>
                  {perDistrict.map((d) => (
                    <tr
                      key={d.district}
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/mrcu/district-wise?district=${encodeURIComponent(d.district)}`)}
                    >
                      <td style={{ color: "#e8003f", fontWeight: 700 }}>{d.district}</td>
                      <td>{d.schoolsCovered}</td>
                      <td>{d.studentSessions}</td>
                      <td>{d.teacherOrientations}</td>
                      <td>{d.parentMeetings}</td>
                      <td>{d.studentsImpacted}</td>
                      <td>{d.teachersImpacted}</td>
                      <td>{d.parentsImpacted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}