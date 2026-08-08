"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
  paymentRequestId?: string | null;
};

type PaymentRequestDetail = {
  _id: string;
  schoolsFrom: number;
  schoolsTo: number;
  amount: number;
  status: "sent" | "filled" | "paid";
  bankAccountHolderName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalRequestId, setModalRequestId] = useState<string | null>(null);
  const [requestDetail, setRequestDetail] = useState<PaymentRequestDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notifications) setItems(data.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openPaymentModal(paymentRequestId: string) {
    setModalRequestId(paymentRequestId);
    setFormError("");
    setSubmitSuccess(false);
    setLoadingDetail(true);
    fetch(`/api/payments/fill?id=${paymentRequestId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.message || "Failed to load payment details");
          return;
        }
        const r: PaymentRequestDetail = data.request;
        setRequestDetail(r);
        setHolderName(r.bankAccountHolderName || "");
        setAccountNumber(r.bankAccountNumber || "");
        setIfsc(r.ifscCode || "");
        setBankName(r.bankName || "");
        setBranchName(r.branchName || "");
      })
      .catch(() => setFormError("Network error while loading payment details"))
      .finally(() => setLoadingDetail(false));
  }

  function closeModal() {
    setModalRequestId(null);
    setRequestDetail(null);
  }

  async function submitBankDetails() {
    setFormError("");
    if (!holderName.trim() || !accountNumber.trim() || !ifsc.trim()) {
      setFormError("Account holder name, account number, and IFSC code are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentRequestId: modalRequestId,
          bankAccountHolderName: holderName,
          bankAccountNumber: accountNumber,
          ifscCode: ifsc,
          bankName,
          branchName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Failed to submit");
        return;
      }
      setSubmitSuccess(true);
    } catch {
      setFormError("Network error while submitting");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.back()} aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="page-title">Notifications</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="page-body">
        {loading && <div className="empty-state">Loading...</div>}

        {!loading && items.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e0223a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div>No notifications yet</div>
          </div>
        )}

        {!loading &&
          items.map((item) => (
            <div
              key={item.id}
              className={`list-card ${item.read ? "" : "unread"}`}
              onClick={() => item.paymentRequestId && openPaymentModal(item.paymentRequestId)}
              style={{ cursor: item.paymentRequestId ? "pointer" : "default" }}
            >
              <div className="list-card-title">{item.title}</div>
              <div className="list-card-msg">{item.message}</div>
              <div className="list-card-date">{new Date(item.createdAt).toLocaleString()}</div>
              {item.paymentRequestId && (
                <div className="list-card-cta">Tap to fill your bank details →</div>
              )}
            </div>
          ))}
      </div>

      <BottomNav />

      {modalRequestId && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Fill Bank Details</div>
              <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {loadingDetail && <div className="empty-state" style={{ marginTop: 20 }}>Loading...</div>}

            {!loadingDetail && requestDetail && !submitSuccess && (
              <>
                <div className="modal-sub">
                  For schools {requestDetail.schoolsFrom}–{requestDetail.schoolsTo} · ₹{requestDetail.amount}
                </div>

                {formError && <div className="modal-error">{formError}</div>}

                <input className="modal-field" placeholder="Bank Account Holder Name" value={holderName} onChange={(e) => setHolderName(e.target.value)} />
                <input className="modal-field" placeholder="Bank Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                <input className="modal-field" placeholder="IFSC Code" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
                <input className="modal-field" placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                <input className="modal-field" placeholder="Branch Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} />

                <button className="modal-submit" disabled={submitting} onClick={submitBankDetails}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </>
            )}

            {submitSuccess && (
              <div className="modal-success">
                ✅ Bank details submitted successfully. Your DCU will process the payment soon.
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #f9723c 0%, #e63242 55%, #e0223a 100%);
          padding: 18px 16px;
          border-radius: 0 0 24px 24px;
        }
        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.18);
          cursor: pointer;
        }
        .page-title {
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
        .page-body {
          padding: 20px 16px calc(96px + env(safe-area-inset-bottom));
          min-height: 40vh;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #999;
          font-size: 14px;
          text-align: center;
          margin-top: 60px;
        }
        .list-card {
          background: #fff;
          border: 1px solid #f0e4e2;
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 12px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
        }
        .list-card.unread {
          border-left: 4px solid #e0223a;
        }
        .list-card-title {
          font-weight: 700;
          font-size: 15px;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .list-card-msg {
          font-size: 13px;
          color: #555;
          line-height: 1.4;
          margin-bottom: 6px;
        }
        .list-card-date {
          font-size: 11px;
          color: #aaa;
        }
        .list-card-cta {
          margin-top: 8px;
          font-size: 12.5px;
          font-weight: 700;
          color: #e0223a;
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100;
        }
        .modal-sheet {
          background: #fff;
          width: 100%;
          max-width: var(--app-max-width, 447px);
          border-radius: 20px 20px 0 0;
          padding: 20px 18px calc(24px + env(safe-area-inset-bottom));
          animation: modalSlideUp 0.25s ease-out;
        }
        @keyframes modalSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .modal-title {
          font-size: 17px;
          font-weight: 800;
          color: #1a1a1a;
        }
        .modal-close {
          background: #f5f5f5;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          font-size: 13px;
        }
        .modal-sub {
          font-size: 13px;
          color: #888;
          margin-bottom: 14px;
        }
        .modal-error {
          color: #c0392b;
          font-size: 13px;
          margin-bottom: 10px;
        }
        .modal-field {
          width: 100%;
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          margin-bottom: 10px;
          box-sizing: border-box;
        }
        .modal-submit {
          width: 100%;
          border: none;
          border-radius: 14px;
          padding: 13px 0;
          background: linear-gradient(135deg, #f9723c 0%, #e0223a 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 4px;
        }
        .modal-success {
          text-align: center;
          padding: 20px 0;
          color: #1e7d34;
          font-size: 14px;
        }
      `}</style>
    </>
  );
}