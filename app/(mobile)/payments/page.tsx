"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export default function MyPaymentsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openImage, setOpenImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/alc/payments")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          throw new Error("unauth");
        }
        return res.json();
      })
      .then((data) => setReceipts(data.receipts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <div className="header-white">
        <div className="brand-red">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub-red">By SPIPL Tech™</div>
        <div className="title-red">My Payments</div>
      </div>

      <div className="card-red">
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && receipts.length === 0 && (
          <div className="empty-note">No payment receipts yet.</div>
        )}

        {!loading && receipts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {receipts.map((r) => (
              <div
                key={r._id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.receiptImageUrl}
                  alt="Payment receipt"
                  onClick={() => setOpenImage(r.receiptImageUrl)}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, color: "#222" }}>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                  {r.note && <div style={{ fontSize: 14, marginTop: 2 }}>{r.note}</div>}
                </div>
                <button
                  className="btn-mini approve"
                  onClick={() => setOpenImage(r.receiptImageUrl)}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="footer-tag white" style={{ marginTop: "auto" }}>
          One Mission, One Platform
        </div>
      </div>

      {openImage && (
        <div
          className="modal-overlay"
          onClick={() => setOpenImage(null)}
          style={{ cursor: "zoom-out" }}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "transparent", boxShadow: "none", padding: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={openImage}
              alt="Payment receipt full view"
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 10 }}
            />
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}