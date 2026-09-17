"use client";

import { useEffect, useState } from "react";

type DistrictRow = {
  district: string;
  rank: number;
  schoolsCovered: number;
  studentSessions: number;
  parentMeetings: number;
  teacherOrientations: number;
};

type ApiResponse = {
  title: string;
  updatedAt: string;
  districts: DistrictRow[];
};

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

export default function DistrictChampionshipPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/districtchampionship", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load standings");
        if (mounted) {
          setData(json);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load standings");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const rows = data?.districts || [];
  const maxSchools = Math.max(1, ...rows.map((r) => r.schoolsCovered));

  return (
    <div className="dc-page">
      <style jsx global>{`
        html, body {
          overflow: auto !important;
          height: auto !important;
        }

        .dc-page {
          position: fixed;
          inset: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background: #e9e9e9;
          font-family: "Segoe UI", Arial, sans-serif;
          padding-bottom: 40px;
        }

        .dc-header {
          background: linear-gradient(160deg, #ff6a3d 0%, #f01446 55%, #e8003f 100%);
          border-radius: 0 0 22px 22px;
          padding: 22px 20px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
        }
        .dc-header-left {
          text-align: center;
          min-width: 0;
        }
        .dc-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.9;
        }
        .dc-title {
          font-size: clamp(18px, 4.6vw, 24px);
          font-weight: 800;
          letter-spacing: -0.2px;
          margin-top: 4px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dc-subtitle {
          display: none;
        }
        .dc-live {
          position: absolute;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .dc-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7cffb2;
          box-shadow: 0 0 6px #7cffb2;
          animation: dc-pulse 1.6s ease-in-out infinite;
        }
        @keyframes dc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .dc-body {
          max-width: 720px;
          margin: 0 auto;
          padding: 22px 16px 0;
        }

        .dc-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dc-row {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .dc-row.rank-1 {
          border: 2px solid #f01446;
          box-shadow: 0 6px 22px rgba(240, 20, 70, 0.18);
        }

        .dc-rank-badge {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f3f3f3;
          color: #888;
          font-weight: 800;
        }
        .dc-rank-badge .num {
          font-size: 20px;
          line-height: 1;
        }
        .dc-rank-badge .lbl {
          font-size: 9px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-top: 2px;
          font-weight: 700;
        }
        .dc-row.rank-1 .dc-rank-badge {
          background: linear-gradient(160deg, #ff6a3d 0%, #f01446 55%, #e8003f 100%);
          color: #fff;
        }
        .dc-row.rank-2 .dc-rank-badge {
          background: #dfe3ea;
          color: #5b6472;
        }
        .dc-row.rank-3 .dc-rank-badge {
          background: #f0dcc8;
          color: #8a5a2b;
        }

        .dc-main {
          flex: 1;
          min-width: 0;
        }
        .dc-name-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
        }
        .dc-name {
          font-size: 18px;
          font-weight: 800;
          color: #1c1c1e;
        }
        .dc-schools {
          font-size: 13px;
          font-weight: 700;
          color: #e8003f;
          white-space: nowrap;
        }
        .dc-schools span {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          margin-left: 3px;
        }

        .dc-bar-track {
          margin-top: 8px;
          height: 6px;
          border-radius: 4px;
          background: #eee;
          overflow: hidden;
        }
        .dc-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #ff6a3d, #e8003f);
          transition: width 0.6s ease;
        }

        .dc-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .dc-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
          color: #555;
          background: #f5f5f5;
          padding: 4px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .dc-chip b {
          color: #1c1c1e;
          font-weight: 800;
        }

        .dc-footer {
          text-align: center;
          margin-top: 26px;
          color: #999;
          font-size: 12px;
        }

        .dc-state {
          text-align: center;
          padding: 60px 20px;
          color: #888;
          font-size: 15px;
        }

        @media (max-width: 480px) {
          .dc-row {
            flex-wrap: wrap;
          }
          .dc-main {
            width: 100%;
          }
        }
      `}</style>

      <div className="dc-header">
        <div className="dc-header-left">
          <div className="dc-eyebrow">Mission AI Ready</div>
          <div className="dc-title">Vidarbha East District Championship</div>
        </div>
        <div className="dc-live">
          <span className="dc-dot" />
          Live
        </div>
      </div>

      <div className="dc-body">
        {loading && <div className="dc-state">Loading standings…</div>}
        {!loading && error && <div className="dc-state">{error}</div>}

        {!loading && !error && rows.length > 0 && (
          <>
            <div className="dc-list">
              {rows.map((d) => (
                <div key={d.district} className={`dc-row rank-${d.rank}`}>
                  <div className="dc-rank-badge">
                    <div className="num">{d.rank}</div>
                    <div className="lbl">{ORDINAL[d.rank - 1]}</div>
                  </div>
                  <div className="dc-main">
                    <div className="dc-name-row">
                      <div className="dc-name">{d.district}</div>
                      <div className="dc-schools">
                        {d.schoolsCovered}
                        <span>schools covered</span>
                      </div>
                    </div>
                    <div className="dc-bar-track">
                      <div
                        className="dc-bar-fill"
                        style={{ width: `${(d.schoolsCovered / maxSchools) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dc-footer">
              Updated {data?.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : ""} &middot; refreshes automatically
            </div>
          </>
        )}
      </div>
    </div>
  );
}