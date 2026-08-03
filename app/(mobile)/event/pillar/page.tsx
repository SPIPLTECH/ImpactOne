"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PILLARS = [
  { id: "Pillar 7", label: "Study Skills - Pillar 7" },
  { id: "Pillar 10", label: "Cyber Security - Pillar 10" },
];

function PillarContent() {
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") || "student-session";

  function handleSelect(pillar: string) {
    router.push(`/event/capture?event=${eventId}&pillar=${encodeURIComponent(pillar)}`);
  }

  return (
    <>
      <div className="screen-header short">
        <div className="brand">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub">By SPIPL Tech™</div>
        <div className="screen-title">Select Pillars</div>
      </div>

      <div className="card-red">
        <div className="event-list">
          {PILLARS.map((p) => (
            <button key={p.id} className="event-item" onClick={() => handleSelect(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="footer-tag white" style={{ marginTop: "auto" }}>
          One Mission, One Platform
        </div>
      </div>
    </>
  );
}

export default function PillarPage() {
  return (
    <Suspense fallback={null}>
      <PillarContent />
    </Suspense>
  );
}
