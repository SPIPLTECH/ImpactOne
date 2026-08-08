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
  const [editingUser, setEditingUser] = useState<AnyRow | null>(null);

  function loadOverview() {
    setLoading(true);
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
  }

  function loadUsers() {
    setLoading(true);
    fetch("/api/superadmin/users")
      .then((res) => {
        if (res.status === 401) return router.push("/admin/login");
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setUsers(data.users || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (tab === "overview") {
      loadOverview();
    } else {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function deleteCheckin(id: string) {
    if (!confirm("Delete this check-in? This cannot be undone.")) return;
    const res = await fetch(`/api/superadmin/checkins/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCheckins((prev) => prev.filter((c) => c._id !== id));
    } else {
      alert("Failed to delete check-in");
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event video? This cannot be undone.")) return;
    const res = await fetch(`/api/superadmin/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } else {
      alert("Failed to delete event");
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/superadmin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } else {
      alert("Failed to delete user");
    }
  }

  async function saveUser(updated: AnyRow) {
    const res = await fetch(`/api/superadmin/users/${updated._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: updated.fullName,
        role: updated.role,
        district: updated.district,
        status: updated.status,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? data.user : u)));
      setEditingUser(null);
    } else {
      alert("Failed to update user");
    }
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
                    <tr>
                      <th>District</th>
                      <th>Institute</th>
                      <th>Photo</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map((c) => (
                      <tr key={c._id}>
                        <td>{c.district}</td>
                        <td>{c.instituteName}</td>
                        <td>
                          <a href={c.photoUrl} target="_blank" rel="noreferrer">
                            View
                          </a>
                        </td>
                        <td>{new Date(c.checkedInAt).toLocaleDateString()}</td>
                        <td>
                          <button className="btn-mini delete" onClick={() => deleteCheckin(c._id)}>
                            Delete
                          </button>
                        </td>
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
                <div key={ev._id} style={{ marginBottom: 14, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 13,
                      color: "#555",
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      {ev.district} · {ev.eventType}
                      {ev.classOfStudents ? ` (${ev.classOfStudents})` : ""} · Present: {ev.presentCount}
                    </span>
                    <button className="btn-mini delete" onClick={() => deleteEvent(ev._id)}>
                      Delete
                    </button>
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
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
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
                      <button className="btn-mini" style={{ marginRight: 6 }} onClick={() => setEditingUser({ ...u })}>
                        Edit
                      </button>
                      <button className="btn-mini delete" onClick={() => deleteUser(u._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editingUser && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
            onClick={() => setEditingUser(null)}
          >
            <div
              className="admin-panel-block"
              style={{ width: 380, background: "#fff", padding: 20, borderRadius: 8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 12 }}>Edit User</h3>

              <label style={{ display: "block", marginBottom: 8 }}>
                Full Name
                <input
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={editingUser.fullName || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                />
              </label>

              <label style={{ display: "block", marginBottom: 8 }}>
                Role
                <select
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={editingUser.role || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="SuperAdmin">SuperAdmin</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </label>

              <label style={{ display: "block", marginBottom: 8 }}>
                District
                <input
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={editingUser.district || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, district: e.target.value })}
                />
              </label>

              <label style={{ display: "block", marginBottom: 16 }}>
                Status
                <select
                  style={{ width: "100%", padding: 6, marginTop: 4 }}
                  value={editingUser.status || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn-mini" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button className="btn-mini" onClick={() => saveUser(editingUser)}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}