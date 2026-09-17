"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { useRouter } from "next/navigation";

const EVENTS = [
  {
    id: "student-session",
    label: "Student Session",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L1 8l11 5 9-4.09V17h2V8L12 3z" fill="currentColor" />
        <path d="M5 10.18v4.32c0 1.1 3.13 3.5 7 3.5s7-2.4 7-3.5v-4.32l-7 3.18-7-3.18z" fill="currentColor" />
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
          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "mom",
    label: "MKCL Olympiad Movement",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 15c3.31 0 6-2.69 6-6V4H6v5c0 3.31 2.69 6 6 6zm-1 2.06c-3.61-.45-6.4-3.13-6.91-6.56H2.5A1.5 1.5 0 011 9V7a2 2 0 012-2h1V3h16v2h1a2 2 0 012 2v2a1.5 1.5 0 01-1.5 1.5h-1.59c-.51 3.43-3.3 6.11-6.91 6.56V19h4v2H8v-2h4v-1.94z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "parikshela-jata-jata",
    label: "Parikshela Jata Jata",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2a5 5 0 015 5c0 2.24-1.34 3.86-3 5.32V15h2v2h-8v-2h2v-2.68C8.34 10.86 7 9.24 7 7a5 5 0 015-5zm-1 17h2v3h-2v-3z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "others",
    label: "Others",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="12" r="2" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <circle cx="19" cy="12" r="2" fill="currentColor" />
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

  const [othersOpen, setOthersOpen] = useState(false);
  const [specifyEvent, setSpecifyEvent] = useState("");
  const [specifyError, setSpecifyError] = useState("");

  function handleSelect(eventId: string) {
    if (eventId === "others") {
      setOthersOpen(true);
      return;
    }
    router.push(`/event/capture?event=${eventId}`);
  }

  function handleOthersContinue() {
    if (!specifyEvent.trim()) {
      setSpecifyError("Please specify the event");
      return;
    }
    router.push(
      `/event/capture?event=others&specifyEvent=${encodeURIComponent(specifyEvent.trim())}`
    );
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
            <div key={ev.id}>
              <button className="event-item" onClick={() => handleSelect(ev.id)}>
                <span className="icon">{ev.icon}</span>
                <span className="event-label">{ev.label}</span>
              </button>

              {ev.id === "others" && othersOpen && (
                <div className="specify-box">
                  <input
                    type="text"
                    className="field"
                    placeholder="Please specify the event"
                    value={specifyEvent}
                    onChange={(e) => {
                      setSpecifyEvent(e.target.value);
                      if (specifyError) setSpecifyError("");
                    }}
                    autoFocus
                  />
                  {specifyError && <div className="error-text">{specifyError}</div>}
                  <button className="btn-red-solid" style={{ marginTop: 10 }} onClick={handleOthersContinue}>
                    Continue
                  </button>
                </div>
              )}
            </div>
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
        .event-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .event-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
          background: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          cursor: pointer;
          text-align: left;
        }
        .icon {
          width: 20px;
          height: 20px;
          min-width: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #1a1a1a;
        }
        .icon svg {
          width: 100%;
          height: 100%;
        }
        .event-label {
          line-height: 1.3;
        }
        .specify-box {
          margin: 8px 0 0;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
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