"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

type Stats = {
  schoolsCovered: number;
  studentSessionsCompleted: number;
  teacherOrientationsCompleted: number;
  parentMeetingsCompleted: number;
  momEvents: number;
  parikshelaEvents: number;
  otherEvents: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
};

const TOP_ACTIONS: { label: string; href: string }[] = [
  { label: "Send Notification", href: "/dcu/notifications" },
  { label: "Send News", href: "/dcu/news" },
  { label: "Send Notice", href: "/dcu/notice" },
  { label: "Check Analytics", href: "/dcu/analytics" },
  { label: "Queries/Issues raised", href: "/dcu/queries" },
  { label: "Feedbacks", href: "/dcu/queries" },
];

export default function DcuDashboardHome() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dcu/analytics?summary=1")
      .then((res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setStats(data.summary);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const s = stats || {
    schoolsCovered: 0,
    studentSessionsCompleted: 0,
    teacherOrientationsCompleted: 0,
    parentMeetingsCompleted: 0,
    momEvents: 0,
    parikshelaEvents: 0,
    otherEvents: 0,
    totalSubmissions: 0,
    approvedSubmissions: 0,
    pendingSubmissions: 0,
    rejectedSubmissions: 0,
  };

  const row1 = [
    { value: s.schoolsCovered, label: "Total Schools Covered" },
    { value: s.studentSessionsCompleted, label: "Total Student Sessions Completed" },
    { value: s.teacherOrientationsCompleted, label: "Total Teacher Orientations Completed" },
    { value: s.parentMeetingsCompleted, label: "Total Parents Meetings Completed" },
  ];
  const rowEvents = [
    { value: s.momEvents, label: "MOM Events" },
    { value: s.parikshelaEvents, label: "Parikshela Jata Jata Events" },
    { value: s.otherEvents, label: "Other Events" },
    { value: s.momEvents + s.parikshelaEvents + s.otherEvents, label: "Total Other Events" },
  ];
  const row2 = [
    { value: s.totalSubmissions, label: "Total Submissions" },
    { value: s.approvedSubmissions, label: "Approved Submissions" },
    { value: s.pendingSubmissions, label: "Pending Submissions" },
    { value: s.rejectedSubmissions, label: "Rejected Submissions" },
  ];

  return (
    <DcuShell title="DCU Admin Dashboard" activeKey="dashboard">
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {TOP_ACTIONS.map((a) => (
          <button key={a.label} className="btn-mini" style={{ background: "#f5a08e", color: "#5a1a10" }} onClick={() => router.push(a.href)}>
            {a.label}
          </button>
        ))}
      </div>

      {loading && <div className="empty-note">Loading...</div>}

      {!loading && (
        <>
          <div className="admin-stat-grid" style={{ marginBottom: 18 }}>
            {row1.map((c) => (
              <div className="admin-stat-card" key={c.label}>
                <div className="value">{c.value}</div>
                <div className="label">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="admin-stat-grid" style={{ marginBottom: 18 }}>
            {rowEvents.map((c) => (
              <div className="admin-stat-card" key={c.label}>
                <div className="value">{c.value}</div>
                <div className="label">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="admin-stat-grid">
            {row2.map((c) => (
              <div className="admin-stat-card" key={c.label}>
                <div className="value">{c.value}</div>
                <div className="label">{c.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </DcuShell>
  );
}
