"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

/* ---------------------------------------------------------
   Typing effect headline
--------------------------------------------------------- */
const HEADER_PHRASES = [
  "Verify Every Visit Instantly",
  "Smart Tracking, Simplified Flow",
  "Making Every Visit Count",
];

function TypingHeadline() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = HEADER_PHRASES[phraseIndex];
    const typingSpeed = deleting ? 35 : 55;
    const pauseAtFull = 1400;
    const pauseAtEmpty = 300;

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pauseAtFull);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      const t = setTimeout(() => {
        setDeleting(false);
        setPhraseIndex((i) => (i + 1) % HEADER_PHRASES.length);
      }, pauseAtEmpty);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setText(current.slice(0, deleting ? text.length - 1 : text.length + 1));
    }, typingSpeed);
    return () => clearTimeout(t);
  }, [text, deleting, phraseIndex]);

  return (
    <div className="typing-headline" aria-live="polite" style={{ color: "#fff" }}>
      <span>{text}</span>
      <span className="typing-cursor">|</span>
    </div>
  );
}

/* ---------------------------------------------------------
   impactOne logo mark
--------------------------------------------------------- */
function ImpactOneLogo() {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="landing-brand" style={{ color: "#fff" }}>
        impactOne<sup>™</sup>
      </div>
      <div className="brand-sub" style={{ color: "#fff" }}>
        By SPIPL Tech™
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Donut stat
--------------------------------------------------------- */
type StatItem = {
  label: string;
  done: number;
  total: number;
};

function DonutStat({ label, done, total }: StatItem) {
  const safeTotal = total > 0 ? total : 1;
  const pct = Math.min(100, Math.round((done / safeTotal) * 100));

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="donut-stat">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#fbd9d2" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e63950"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="17" fontWeight={800} fill="#e63950">
          {done}
        </text>
      </svg>
      <div className="donut-label">{label}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   Image carousel 
--------------------------------------------------------- */
const STRIP_IMAGES = ["/image1.png", "/image2.png", "/image3.png"];

function ImageStrip() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % STRIP_IMAGES.length);
    }, 3500); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="image-carousel">
      <div
        className="image-carousel-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {STRIP_IMAGES.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={`Banner Slide ${index + 1}`} className="image-carousel-item" />
        ))}
      </div>
      <div className="image-carousel-dots">
        {STRIP_IMAGES.map((src, i) => (
          <button
            key={src}
            className={`image-carousel-dot ${i === activeIndex ? "active" : ""}`}
            onClick={() => setActiveIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Dashboard page
--------------------------------------------------------- */
type DashboardStats = {
  studentSession: { done: number; total: number };
  teacherOrientation: { done: number; total: number };
  parentMeet: { done: number; total: number };
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.username) setUserName(data.user.username);
      })
      .catch(() => {});

    fetch("/api/dashboard/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  const donutItems: StatItem[] = useMemo(
    () => [
      { label: "Student Session", done: stats?.studentSession.done ?? 0, total: stats?.studentSession.total ?? 0 },
      { label: "Teacher Orientation", done: stats?.teacherOrientation.done ?? 0, total: stats?.teacherOrientation.total ?? 0 },
      { label: "Parent Meet", done: stats?.parentMeet.done ?? 0, total: stats?.parentMeet.total ?? 0 },
    ],
    [stats]
  );

  return (
    <>
      <div className="impact-header">
        <div className="header-icon-row">
          <button
            className="header-icon-btn"
            aria-label="Notifications"
            onClick={() => router.push("/notifications")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button
            className="header-icon-btn"
            aria-label="News"
            onClick={() => router.push("/news")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h13a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H6a2 2 0 0 1-2-2V4z" />
              <path d="M18 19V4a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2" />
              <path d="M8 8h6" />
              <path d="M8 12h6" />
              <path d="M8 16h4" />
            </svg>
          </button>
          <button
            className="header-icon-btn"
            aria-label="Notice"
            onClick={() => router.push("/notice")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M9 13h6" />
              <path d="M9 17h4" />
            </svg>
          </button>
        </div>

        <TypingHeadline />
        <ImpactOneLogo />
      </div>

      <div className="impact-card">
        <div className="impact-greeting">
          Hey! <span className="impact-greeting-name">{userName || "Test"}</span>
        </div>

        <button className="impact-cta" onClick={() => router.push("/checkin/select-alc")}>
          Let&apos;s Begin
        </button>

        <div className="donut-row">
          {donutItems.map((item) => (
            <DonutStat key={item.label} {...item} />
          ))}
        </div>

        {/* Carousel Included */}
        <ImageStrip />

        <div className="impact-footer">One Mission, One Platform</div>
      </div>

      <BottomNav />

      {/* FIXED: Changed to "style jsx global" */}
      <style jsx global>{`
        .impact-header {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #f9723c 0%, #e63242 55%, #e0223a 100%);
          padding: 28px 20px 40px;
          border-radius: 0 0 32px 32px;
        }
        .header-icon-row {
          position: absolute;
          top: 18px;
          right: 16px;
          z-index: 2;
          display: flex;
          gap: 10px;
        }
        .header-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.18);
          cursor: pointer;
          padding: 0;
          transition: background 0.2s ease;
        }
        .header-icon-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .header-icon-btn:active {
          background: rgba(255, 255, 255, 0.4);
        }
      .typing-headline {
  position: relative;
  z-index: 1;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  min-height: 58px;
  text-align: center;
  padding: 30px 6px 0;   /* pehle "0 6px" tha, top mein 12px add kiya */
  line-height: 1.25;
}
        .typing-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        .impact-card {
          position: relative;
          margin-top: -10px;
          background: #fff;
          border-radius: 32px 32px 0 0;
          padding: 26px 0 calc(96px + env(safe-area-inset-bottom));
          overflow-x: hidden;
        }
        .impact-greeting {
          text-align: center;
          font-size: 22px;
          color: #1a1a1a;
          margin-bottom: 22px;
          padding: 0 20px;
        }
        .impact-greeting-name {
          font-weight: 800;
          color: #e8452c;
        }
        .impact-cta {
          display: block;
          margin: 0 auto;
          width: calc(100% - 40px);
          max-width: 320px;
          padding: 15px 0;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #f9723c 0%, #e0223a 100%);
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(230, 50, 66, 0.3);
        }
        .donut-row {
          display: flex;
          justify-content: space-between;
          gap: 6px;
          margin-top: 32px;
          padding: 0 20px;
        }
        .donut-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1 1 0;
          min-width: 0;
        }
        .donut-label {
          margin-top: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #1a1a1a;
          text-align: center;
          white-space: nowrap;
          max-width: 100%;
        }

        /* CAROUSEL CSS */
        .image-carousel {
          position: relative;
          margin-top: 32px;
          width: 100%;
          overflow: hidden;
          background-color: #e0223a; 
        }
        .image-carousel-track {
          display: flex;
          flex-wrap: nowrap;
          width: 100%;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .image-carousel-item {
          flex: 0 0 100%;
          width: 100%;
          max-width: 100%;
          aspect-ratio: 16 / 7.5; 
          object-fit: cover;
          display: block;
        }
        .image-carousel-dots {
          position: absolute;
          bottom: 16px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }
        .image-carousel-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: none;
          padding: 0;
          background: rgba(255, 255, 255, 0.4); 
          cursor: pointer;
          transition: all 0.4s ease;
        }
        .image-carousel-dot.active {
          background: #ffffff; 
          width: 24px;         
          border-radius: 6px;
        }

        .impact-footer {
          text-align: center;
          font-size: 11px;
          color: #b8b8b8;
          margin-top: 24px;
          padding: 0 20px;
        }
      `}</style>
    </>
  );
}