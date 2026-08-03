"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "./DcuShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function BroadcastComposer({
  kind,
  title,
  activeKey,
  apiPath,
}: {
  kind: "notification" | "news" | "notice";
  title: string;
  activeKey: string;
  apiPath: string;
}) {
  const router = useRouter();
  const [audience, setAudience] = useState<"all" | "single">("all");
  const [alcList, setAlcList] = useState<AnyRow[]>([]);
  const [targetId, setTargetId] = useState("");
  const [heading, setHeading] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<AnyRow[]>([]);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    fetch("/api/dcu/users?status=approved")
      .then((r) => (r.status === 401 ? router.push("/admin/login") : r.json()))
      .then((d) => d && setAlcList(d.users || []))
      .catch(() => {});
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHistory() {
    setHistoryError("");
    try {
      const res = await fetch(apiPath);
      const text = await res.text();
      let data: AnyRow = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setHistoryError(`Server did not return valid JSON (status ${res.status}). Raw: ${text.slice(0, 200)}`);
        return;
      }
      if (!res.ok) {
        setHistoryError(data.message || `Failed to load (status ${res.status})`);
        return;
      }
      setHistory(data.items || []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Network error while loading history");
    }
  }

  async function handleSend() {
    setError("");
    setSuccess("");
    if (!heading.trim() || !message.trim()) {
      setError("Please fill both title and message");
      return;
    }
    if (audience === "single" && !targetId) {
      setError("Please choose an ALC/Intern to send to");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          targetUserId: audience === "single" ? targetId : undefined,
          title: heading,
          message,
        }),
      });
      const text = await res.text();
      let data: AnyRow = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(`Server did not return valid JSON (status ${res.status}). Raw: ${text.slice(0, 200)}`);
        return;
      }
      if (!res.ok) {
        setError(data.message || `Failed to send (status ${res.status})`);
        return;
      }
      setSuccess(`${kind[0].toUpperCase()}${kind.slice(1)} sent successfully`);
      setHeading("");
      setMessage("");
      setTargetId("");
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error while sending");
    } finally {
      setSending(false);
    }
  }

  return (
    <DcuShell title={title} activeKey={activeKey}>
      {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
      {success && <div style={{ color: "#1e7d34", marginBottom: 10, fontSize: 14 }}>{success}</div>}

      <div style={{ maxWidth: 480, marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button className="btn-mini" style={{ background: audience === "all" ? "#e8003f" : "#eee", color: audience === "all" ? "#fff" : "#333" }} onClick={() => setAudience("all")}>
            Send to All ALC/Intern (District)
          </button>
          <button className="btn-mini" style={{ background: audience === "single" ? "#e8003f" : "#eee", color: audience === "single" ? "#fff" : "#333" }} onClick={() => setAudience("single")}>
            Send to a Single ALC/Intern
          </button>
        </div>

        {audience === "single" && (
          <select className="select-field" style={{ width: "100%", marginBottom: 10 }} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Choose ALC / Intern</option>
            {alcList.map((u) => (
              <option key={u._id} value={u._id}>{u.fullName || u.username} ({u.role})</option>
            ))}
          </select>
        )}

        <input className="field" placeholder="Title" value={heading} onChange={(e) => setHeading(e.target.value)} style={{ marginBottom: 10 }} />
        <textarea className="field" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} style={{ marginBottom: 10, minHeight: 100, width: "100%" }} />

        <button className="btn-mini approve" disabled={sending} onClick={handleSend}>
          {sending ? "Sending..." : `Send ${kind[0].toUpperCase()}${kind.slice(1)}`}
        </button>
      </div>

      <h3 style={{ marginBottom: 12 }}>Recently Sent</h3>
      {historyError && <div className="error-text" style={{ marginBottom: 10 }}>{historyError}</div>}
      {!historyError && history.length === 0 && <div className="empty-note">Nothing sent yet.</div>}
      {history.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Message</th>
              <th>Audience</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h._id}>
                <td>{h.title}</td>
                <td>{h.message}</td>
                <td>{h.audience === "all" ? "All ALC/Intern" : h.targetUser?.fullName || h.targetUser?.username || "Single"}</td>
                <td>{new Date(h.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DcuShell>
  );
}