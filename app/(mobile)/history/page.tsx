"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";

type HistoryItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

const STATUS_COLOR: Record<string, string> = {
  approved: "#1e7d34",
  pending: "#b8860b",
  rejected: "#c0392b",
};

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/history")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to load history");
          return;
        }
        setItems(data.items || []);
      })
      .catch(() => setError("Network error while loading history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="header-white">
        <div className="title-red" style={{ textAlign: "center" }}>
          History
        </div>
      </div>

      <div className="card-red" style={{ paddingBottom: 100 }}>
        {loading && <div style={{ textAlign: "center", color: "#999", marginTop: 20 }}>Loading...</div>}
        {error && <div style={{ textAlign: "center", color: "#c0392b", marginTop: 20 }}>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
            You haven&apos;t submitted anything yet.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #f0e3e0",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#fff",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{item.title}</div>
                <div style={{ fontSize: 12.5, color: "#888", marginTop: 4 }}>
                  {new Date(item.createdAt).toLocaleDateString()} ·{" "}
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "inline-block",
                    fontSize: 11.5,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    color: STATUS_COLOR[item.status] || "#555",
                  }}
                >
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </>
  );
}