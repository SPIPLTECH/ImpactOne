"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DcuShell from "../_components/DcuShell";

type BarRow = { alcName: string; completed: number };

function BarChart({ data }: { data: BarRow[] }) {
  const max = Math.max(1, ...data.map((d) => d.completed));
  const barWidth = 42;
  const gap = 22;
  const chartHeight = 260;
  const width = Math.max(400, data.length * (barWidth + gap) + gap);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={width} height={chartHeight + 60} viewBox={`0 0 ${width} ${chartHeight + 60}`}>
        {/* baseline */}
        <line x1={0} y1={chartHeight} x2={width} y2={chartHeight} stroke="#eee" strokeWidth={1} />

        {data.map((d, i) => {
          const barHeight = (d.completed / max) * (chartHeight - 20);
          const x = gap + i * (barWidth + gap);
          const y = chartHeight - barHeight;
          return (
            <g key={d.alcName}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="#e8003f" />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="13" fontWeight={700} fill="#e8003f">
                {d.completed}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 18}
                textAnchor="middle"
                fontSize="10.5"
                fill="#555"
                transform={`rotate(20 ${x + barWidth / 2} ${chartHeight + 18})`}
              >
                {d.alcName.length > 14 ? d.alcName.slice(0, 13) + "…" : d.alcName}
              </text>
            </g>
          );
        })}

        {data.length === 0 && (
          <text x={width / 2} y={chartHeight / 2} textAnchor="middle" fontSize="14" fill="#999">
            No data yet
          </text>
        )}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<BarRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dcu/analytics");
      if (res.status === 401) return router.push("/admin/login");
      const json = await res.json();
      setData(json.perAlc || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DcuShell title="Analytics" activeKey="analytics">
      <h3 style={{ marginBottom: 16 }}>Schools Completed per ALC / Intern</h3>
      <div className="admin-panel-block">
        {loading && <div className="empty-note">Loading...</div>}
        {!loading && <BarChart data={data} />}
      </div>
    </DcuShell>
  );
}
