"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "users">("overview");
  const [checkins, setCheckins] = useState<AnyRow[]>([]);
  const [events, setEvents] = useState<AnyRow[]>([]);
  const [users, setUsers] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab === "overview") {
      fetch("/api/superadmin/overview")
        .then((res) => {
          if (res.status === 401) return router.push("/admin/login");
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          setCheckins(data.checkins || []);
          setEvents(data.events || []);
        })
        .finally(() => setLoading(false));
    } else {
      fetch("/api/superadmin/users")
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []))
        .finally(() => setLoading(false));
    }
  }, [tab, router]);

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/superadmin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u._id !== id));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          impact<span>One™</span>
        </div>
        <a className={`admin-nav-item ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>
          Approved Submissions
        </a>
        <a className={`admin-nav-item ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
          Manage Users
        </a>
        <a className="admin-nav-item" onClick={handleLogout}>
          Logout
        </a>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>Super Admin Dashboard</h1>
        </div>

        {loading && <div className="empty-note">Loading...</div>}

        {!loading && tab === "overview" && (
          <>
            <div className="admin-stat-grid">
              <div className="admin-stat-card">
                <div className="label">Approved Check-ins</div>
                <div className="value">{checkins.length}</div>
              </div>
              <div className="admin-stat-card">
                <div className="label">Approved Events</div>
                <div className="value">{events.length}</div>
              </div>
            </div>

            <div className="admin-panel-block" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 12 }}>Approved Check-ins</h3>
              {checkins.length === 0 && <div className="empty-note">None yet.</div>}
              {checkins.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr><th>District</th><th>Institute</th><th>Photo</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {checkins.map((c) => (
                      <tr key={c._id}>
                        <td>{c.district}</td>
                        <td>{c.instituteName}</td>
                        <td><a href={c.photoUrl} target="_blank" rel="noreferrer">View</a></td>
                        <td>{new Date(c.checkedInAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-panel-block">
              <h3 style={{ marginBottom: 12 }}>Approved Event Videos</h3>
              {events.length === 0 && <div className="empty-note">None yet.</div>}
              {events.map((ev) => (
                <div key={ev._id} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
                    {ev.district} · {ev.eventType}
                    {ev.classOfStudents ? ` (${ev.classOfStudents})` : ""} · Present: {ev.presentCount}
                  </div>
                  <div className="video-grid">
                    {ev.video?.url && (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={ev.video.url} controls />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && tab === "users" && (
          <div className="admin-panel-block">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Username</th><th>Role</th><th>District</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.fullName}</td>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>{u.district}</td>
                    <td>{u.status}</td>
                    <td>
                      <button className="btn-mini delete" onClick={() => deleteUser(u._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}