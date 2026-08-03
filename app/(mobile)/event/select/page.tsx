"use client";

import BottomNav from "@/components/BottomNav";
import { useRouter } from "next/navigation";

const EVENTS = [
  {
    id: "student-session",
    label: "Student Session",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 3L1 8l11 5 9-4.09V17h2V8L12 3z"
          fill="currentColor"
        />
        <path
          d="M5 10.18v4.32c0 1.1 3.13 3.5 7 3.5s7-2.4 7-3.5v-4.32l-7 3.18-7-3.18z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "parent-meeting",
    label: "Parent Meeting",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "teacher-orientation",
    label: "Teacher Orientation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z"
          fill="currentColor"
        />
        <path
          d="M19 8h2v2h-2v2h-2v-2h-2V8h2V6h2v2z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

const SELECT_EVENT_GUIDELINES = [
  "Select the correct event before starting.",
  "Verify the event name carefully before proceeding.",
  "Ensure you are performing the activity for the selected event only.",
];

export default function SelectEventPage() {
  const router = useRouter();

  function handleSelect(eventId: string) {
    router.push(`/event/capture?event=${eventId}`);
  }

  return (
    <>
      <div className="header-white">
        <div className="brand-red">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub-red">By SPIPL Tech™</div>
        <div className="title-red">Select Event</div>
      </div>

      <div className="card-red">
        <div className="event-list">
          {EVENTS.map((ev) => (
            <button
              key={ev.id}
              className="event-item"
              onClick={() => handleSelect(ev.id)}
            >
              <span className="icon" style={{ width: 22, height: 22, display: "inline-flex" }}>
                {ev.icon}
              </span>
              {ev.label}
            </button>
          ))}
        </div>

        <div className="guidelines-box">
          <div className="guidelines-title">Event Selection Guidelines</div>
          <ul className="guidelines-list">
            {SELECT_EVENT_GUIDELINES.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="footer-tag white" style={{ marginTop: "auto" }}>
          One Mission, One Platform
        </div>
      </div>

      <style jsx>{`
        .header-white {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .guidelines-box {
          margin-top: 28px;
          width: 100%;
          max-width: 340px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 18px 20px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .guidelines-title {
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 10px;
          text-align: center;
        }
        .guidelines-list {
          margin: 0 auto;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .guidelines-list li {
          color: rgba(255, 255, 255, 0.92);
          font-size: 13px;
          line-height: 1.4;
          text-align: center;
        }
      `}</style>
      <BottomNav />
    </>
  );
}