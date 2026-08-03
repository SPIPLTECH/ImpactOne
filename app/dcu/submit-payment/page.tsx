"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadToCloudinaryDirect } from "@/lib/cloudinaryClient";
import DcuShell from "../_components/DcuShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function SubmitPaymentPage() {
  const router = useRouter();
  const [approvedAlcs, setApprovedAlcs] = useState<AnyRow[]>([]);
  const [receipts, setReceipts] = useState<AnyRow[]>([]);
  const [selectedAlcId, setSelectedAlcId] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, receiptsRes] = await Promise.all([
        fetch("/api/dcu/users?status=approved"),
        fetch("/api/dcu/payments"),
      ]);
      if (usersRes.status === 401 || receiptsRes.status === 401) return router.push("/admin/login");
      const usersData = await usersRes.json();
      const receiptsData = await receiptsRes.json();
      setApprovedAlcs(usersData.users || []);
      setReceipts(receiptsData.receipts || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReceiptFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaymentError("");
    setPaymentSuccess("");
    setUploadingReceipt(true);
    try {
      const url = await uploadToCloudinaryDirect(file, "image", "impactone/payments", `receipt_${Date.now()}`);
      setReceiptImageUrl(url);
    } catch {
      setPaymentError("Image upload failed, please try again");
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function handleSubmitReceipt() {
    setPaymentError("");
    setPaymentSuccess("");
    if (!selectedAlcId) {
      setPaymentError("Please select an ALC/Intern");
      return;
    }
    if (!receiptImageUrl) {
      setPaymentError("Please upload the payment screenshot");
      return;
    }
    const res = await fetch("/api/dcu/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alcUserId: selectedAlcId, receiptImageUrl, note: receiptNote }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPaymentError(data.message || "Submission failed");
      return;
    }
    setPaymentSuccess("Payment receipt submitted successfully");
    setSelectedAlcId("");
    setReceiptImageUrl("");
    setReceiptNote("");
    load();
  }

  return (
    <DcuShell title="Submit Payment Receipt" activeKey="submit-payment">
      {paymentError && <div className="error-text" style={{ marginBottom: 10 }}>{paymentError}</div>}
      {paymentSuccess && <div style={{ color: "#1e7d34", marginBottom: 10, fontSize: 14 }}>{paymentSuccess}</div>}

      <div style={{ maxWidth: 420, marginBottom: 24 }}>
        <select className="select-field" style={{ marginBottom: 10, width: "100%" }} value={selectedAlcId} onChange={(e) => setSelectedAlcId(e.target.value)}>
          <option value="">Choose ALC / Intern</option>
          {approvedAlcs.map((u) => (
            <option key={u._id} value={u._id}>{u.fullName || u.username} ({u.role})</option>
          ))}
        </select>

        <input type="file" accept="image/*" onChange={handleReceiptFileChange} style={{ marginBottom: 10, display: "block" }} />
        {uploadingReceipt && <div className="empty-note">Uploading image...</div>}
        {receiptImageUrl && !uploadingReceipt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receiptImageUrl} alt="Receipt preview" style={{ maxWidth: 200, borderRadius: 8, marginBottom: 10, display: "block" }} />
        )}

        <input className="field" placeholder="Note (optional)" value={receiptNote} onChange={(e) => setReceiptNote(e.target.value)} style={{ marginBottom: 10 }} />

        <button className="btn-mini approve" onClick={handleSubmitReceipt} disabled={uploadingReceipt}>Submit Payment Receipt</button>
      </div>

      <h3 style={{ marginBottom: 12 }}>Previously Submitted Receipts</h3>
      {loading && <div className="empty-note">Loading...</div>}
      {!loading && receipts.length === 0 && <div className="empty-note">No receipts submitted yet.</div>}
      {!loading && receipts.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ALC / Intern</th>
              <th>Receipt</th>
              <th>Note</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r._id}>
                <td>{r.alcUser?.fullName || r.alcUser?.username}</td>
                <td><a href={r.receiptImageUrl} target="_blank" rel="noreferrer">View</a></td>
                <td>{r.note || "-"}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DcuShell>
  );
}
