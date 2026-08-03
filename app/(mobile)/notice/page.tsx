"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

type NoticeItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

export default function NoticePage() {
  const router = useRouter();
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notice")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notice) setItems(data.notice);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.back()} aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="page-title">Notice</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="page-body">
        {loading && <div className="empty-state">Loading...</div>}

        {!loading && items.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e0223a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="2" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="16" y2="14" />
            </svg>
            <div>No notice yet</div>
          </div>
        )}

        {!loading &&
          items.map((item) => (
            <div key={item.id} className={`list-card ${item.read ? "" : "unread"}`}>
              <div className="list-card-title">{item.title}</div>
              <div className="list-card-msg">{item.message}</div>
              <div className="list-card-date">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
          ))}
      </div>

      <BottomNav />

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
      `}</style>
    </>
  );
}