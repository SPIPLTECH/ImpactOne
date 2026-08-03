"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

type EligibleRow = {
  alcUserId: string;
  name: string;
  role: string;
  schoolsCompletedTotal: number;
  schoolsAlreadyPaidFor: number;
  pendingSchools: number;
  tranches: number;
  amount: number;
};

export default function EligiblePaymentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<EligibleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dcu/payments/eligible");
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(data.eligible || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSend(alcUserId: string) {
    setSendingId(alcUserId);
    try {
      const res = await fetch("/api/dcu/payments/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alcUserId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to send notification");
        return;
      }
      load();
    } finally {
      setSendingId(null);
    }
  }

  return (
    <DcuShell title="ALC / Intern Payment Eligibility" activeKey="eligible-payments">
      <div style={{ marginBottom: 16, fontSize: 13, color: "#777", maxWidth: 640 }}>
        An ALC / Intern appears here the moment they cross a fresh block of <b>2 completed schools</b>
        that has not been notified yet. Every block of 2 schools = ₹1500. Once you press <b>Send</b>,
        that block is marked as notified — they will need to complete 2 more schools to show up again.
      </div>

      <div className="admin-panel-block">
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && rows.length === 0 && <div className="empty-note">No one is currently eligible for a new payment.</div>}
        {!loading && rows.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name of ALC/Intern</th>
                <th>Schools Completed</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Send Notification</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.alcUserId}>
                  <td>{r.name} <span style={{ color: "#999", fontSize: 12 }}>({r.role})</span></td>
                  <td>{r.schoolsCompletedTotal}</td>
                  <td>₹{r.amount}</td>
                  <td>Eligible</td>
                  <td>
                    <button className="btn-mini approve" disabled={sendingId === r.alcUserId} onClick={() => handleSend(r.alcUserId)}>
                      {sendingId === r.alcUserId ? "Sending..." : "Send"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DcuShell>
  );
}
