"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function PaymentDetailsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "sent" | "filled" | "paid">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dcu/payments/details");
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setRows(data.requests || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <DcuShell title="ALC / Intern Bank Details" activeKey="payment-details">
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {(["all", "sent", "filled", "paid"] as const).map((f) => (
          <button
            key={f}
            className="btn-mini"
            style={{ background: filter === f ? "#e8003f" : "#eee", color: filter === f ? "#fff" : "#333", textTransform: "capitalize" }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="admin-panel-block">
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && filtered.length === 0 && <div className="empty-note">No payment requests yet.</div>}
        {!loading && filtered.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Schools</th>
                <th>Amount</th>
                <th>Account Holder</th>
                <th>Account Number</th>
                <th>IFSC</th>
                <th>Bank / Branch</th>
                <th>Cheque Image</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td>{r.alcUser?.fullName || r.alcUser?.username}</td>
                  <td>{r.schoolsFrom}–{r.schoolsTo}</td>
                  <td>₹{r.amount}</td>
                  <td>{r.bankAccountHolderName || "-"}</td>
                  <td>{r.bankAccountNumber || "-"}</td>
                  <td>{r.ifscCode || "-"}</td>
                  <td>{[r.bankName, r.branchName].filter(Boolean).join(" / ") || "-"}</td>
                  <td>
                    {r.chequeImageUrl ? (
                      <a href={r.chequeImageUrl} target="_blank" rel="noreferrer">View</a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DcuShell>
  );
}
