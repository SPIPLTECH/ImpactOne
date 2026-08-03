"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLES = ["ALC", "Intern"];

// role -> dashboard route mapping
const ROLE_DASHBOARD: Record<string, string> = {
  ALC: "/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [permError, setPermError] = useState("");
  const [checkingPerms, setCheckingPerms] = useState(false);

  // Strictly ask for GPS location permission. Resolves only once the
  // browser has actually granted it (or rejects with a clear reason).
  function requestLocationPermission(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Location is not supported on this device/browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(
              new Error(
                "Location access was denied. Please allow Location for this site in your browser settings and try again."
              )
            );
          } else {
            reject(
              new Error(
                "Unable to fetch your location. Please turn on GPS/Location and try again."
              )
            );
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  // Strictly ask for Camera (+ mic, used for the 10s videos) permission.
  function requestCameraPermission(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new Error("Camera is not supported on this device/browser"));
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" }, audio: true })
        .then((stream) => {
          // We only needed the permission prompt — stop the stream immediately.
          stream.getTracks().forEach((t) => t.stop());
          resolve();
        })
        .catch(() => {
          reject(
            new Error(
              "Camera/Microphone access was denied. Please allow Camera & Microphone for this site in your browser settings and try again."
            )
          );
        });
    });
  }

  async function ensurePermissions() {
    setPermError("");
    setCheckingPerms(true);
    try {
      // Location first, then camera — matches the order the app actually needs them in.
      await requestLocationPermission();
      await requestCameraPermission();
    } catch (err) {
      setPermError(err instanceof Error ? err.message : "Permission was denied");
      throw err;
    } finally {
      setCheckingPerms(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPermError("");

    if (!username || !password || !role) {
      setError("Please fill all fields and choose a role");
      return;
    }

    // Strict gate: don't even attempt login until Location + Camera are granted.
    try {
      await ensurePermissions();
    } catch {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      const loggedInRole = data.user?.role || role;
      router.push(ROLE_DASHBOARD[loggedInRole] || "/dashboard");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="screen-header short">
        <div className="brand">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub">By SPIPL Tech™</div>
        <div className="screen-title">SIGN IN</div>
      </div>

      <div className="screen-body">
        <form className="form-area" onSubmit={handleLogin}>
          {error && <div className="error-text">{error}</div>}
          {permError && (
            <div className="error-text">
              {permError}
              <div style={{ marginTop: 6 }}>
                <button
                  type="button"
                  className="btn-outline small"
                  onClick={() => ensurePermissions()}
                  disabled={checkingPerms}
                >
                  {checkingPerms ? "..." : "Allow & Retry"}
                </button>
              </div>
            </div>
          )}

          <input
            className="field"
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="field"
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="forgot">
            <Link href="/forgot-password" style={{ color: "inherit", textDecoration: "none" }}>
              Forgot Password ?
            </Link>
          </div>

          <div className="select-wrap">
            <select
              className="select-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Choose Role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-outline" disabled={loading || checkingPerms}>
            {checkingPerms ? "Requesting permissions..." : loading ? "..." : "LOG IN"}
          </button>

          <div className="switch-text">
            Don&apos;t have an Account? <Link href="/signup">Create Account</Link>
          </div>
        </form>

        <div className="footer-tag">One Mission, One Platform</div>
      </div>
    </>
  );
}