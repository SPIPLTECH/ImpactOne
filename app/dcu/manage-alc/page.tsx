"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function ManageAlcPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState<AnyRow>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dcu/manage-alc");
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(data.users || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(u: AnyRow) {
    setEditing(u);
    setForm({
      fullName: u.fullName || "",
      phone: u.phone || "",
      email: u.email || "",
      alcCenterName: u.alcCenterName || "",
      role: u.role || "ALC",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dcu/manage-alc/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Update failed");
        return;
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(id: string) {
    if (!confirm("Permanently delete this ALC/Intern account?")) return;
    await fetch(`/api/dcu/manage-alc/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <DcuShell title="Manage ALC / Intern" activeKey="manage-alc">
      <div className="admin-panel-block">
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && rows.length === 0 && <div className="empty-note">No approved ALC/Intern accounts yet.</div>}
        {!loading && rows.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>ALC Center</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>{u.alcCenterName || "-"}</td>
                  <td>{u.phone}</td>
                  <td>
                    <button className="btn-mini approve" onClick={() => openEdit(u)}>Edit</button>
                    <button className="btn-mini delete" onClick={() => removeUser(u._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Edit {editing.fullName}</h3>
            <input className="field" placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={{ marginBottom: 8 }} />
            <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ marginBottom: 8 }} />
            <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ marginBottom: 8 }} />
            <input className="field" placeholder="ALC Center Name" value={form.alcCenterName} onChange={(e) => setForm({ ...form, alcCenterName: e.target.value })} style={{ marginBottom: 8 }} />
            <select className="select-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ marginBottom: 8, width: "100%" }}>
              <option value="ALC">ALC</option>
              <option value="Intern">Intern</option>
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-mini approve" disabled={saving} onClick={saveEdit}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </DcuShell>
  );
}
