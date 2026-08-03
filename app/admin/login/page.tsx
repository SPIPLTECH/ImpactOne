"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import alcData from "@/data/alcs.json";

const DISTRICTS = Object.keys(alcData);
const ROLE_OPTIONS = [
  { label: "Admin", value: "SuperAdmin" },
  { label: "MRCU", value: "MRCU" },
  { label: "DCU", value: "DCU" },
];

const ROUTES: Record<string, string> = {
  SuperAdmin: "/admin/dashboard",
  MRCU: "/mrcu/dashboard",
  DCU: "/dcu/dashboard",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SuperAdmin");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username || !password || !role) {
      setError("Please fill all fields");
      return;
    }
    if (role === "DCU" && !district) {
      setError("Please select your district");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, district }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.push(ROUTES[data.admin?.role || role] || "/admin/dashboard");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          impactOne<sup>™</sup>
        </div>
        <div className="admin-login-sub">By SPIPL Tech™</div>
        <div className="admin-login-title">Admin Login</div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-text" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <label className="admin-field-label">Login As</label>
          <select
            className="admin-field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {role === "DCU" && (
            <>
              <label className="admin-field-label">District</label>
              <select
                className="admin-field"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="">Select District</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="admin-field-label">Username</label>
          <input
            className="admin-field"
            type="text"
            placeholder={role === "DCU" ? "e.g. dcu_nagpur" : "Username"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="admin-field-label">Password</label>
          <input
            className="admin-field"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "Signing in..." : "LOGIN"}
          </button>
        </form>

        <div className="admin-login-footer">
          Restricted access — impactOne Admin Panel
        </div>
      </div>
    </div>
  );
}
