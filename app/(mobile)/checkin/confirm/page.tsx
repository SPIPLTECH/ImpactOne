"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";

type Gps = { lat: number; lng: number; accuracy: number } | null;

const IST_TIMEZONE = "Asia/Kolkata";

// Fetch the REAL current time from a network time server (not the phone's
// own clock). This prevents someone from faking their check-in time by
// changing their device date/time settings.
async function fetchTrueIstTime(): Promise<{ date: Date; source: "network" | "device" }> {
  // Primary source
  try {
    const res = await fetch(
      "https://timeapi.io/api/Time/current/zone?timeZone=Asia%2FKolkata",
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.dateTime) {
        const d = new Date(`${data.dateTime}+05:30`);
        if (!isNaN(d.getTime())) return { date: d, source: "network" };
      }
    }
  } catch {
    // fall through to backup source
  }

  // Backup source
  try {
    const res = await fetch("https://worldtimeapi.org/api/timezone/Asia/Kolkata", {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.datetime) {
        const d = new Date(data.datetime);
        if (!isNaN(d.getTime())) return { date: d, source: "network" };
      }
    }
  } catch {
    // fall through to device clock
  }

  // Last resort — device clock (only used if both network time servers are unreachable)
  return { date: new Date(), source: "device" };
}

function fetchGps(): Promise<Gps> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

const CHECKIN_GUIDELINES = [
  "Check in only after reaching the school gate.",
  "Keep GPS enabled before checking in.",
  "Ensure your location is accurate.",
  "Capture a clear photo at the entrance.",
  "Verify school details before submitting.",
];

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const district = searchParams.get("district") || "";
  const alc = searchParams.get("alc") || "";

  const [checkedIn, setCheckedIn] = useState(false);
  const [timestamp, setTimestamp] = useState<Date | null>(null);
  const [timeSource, setTimeSource] = useState<"network" | "device" | null>(null);
  const [gps, setGps] = useState<Gps>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckIn() {
    setError("");
    setLoading(true);
    try {
      const [{ date, source }, location] = await Promise.all([
        fetchTrueIstTime(),
        fetchGps(),
      ]);

      if (!location) {
        setError("Unable to fetch your location. Please allow Location and try again.");
        return;
      }

      setTimestamp(date);
      setTimeSource(source);
      setGps(location);
      setCheckedIn(true);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: IST_TIMEZONE,
    });
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: IST_TIMEZONE,
    });
  }

  function handleNext() {
    if (!checkedIn || !timestamp) return;
    const params = new URLSearchParams({
      district,
      alc,
      checkinTime: timestamp.toISOString(),
      timeSource: timeSource || "device",
      ...(gps
        ? {
            lat: String(gps.lat),
            lng: String(gps.lng),
            accuracy: String(gps.accuracy),
          }
        : {}),
    });
    router.push(`/checkin/details?${params.toString()}`);
  }

  return (
    <>
      <div className="header-white">
        <div className="brand-red">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub-red">By SPIPL Tech™</div>
        <div className="title-red">Hey! Test</div>
      </div>

      <div className="card-red">
        {error && <div className="error-text">{error}</div>}
<center>
     <button className="btn-white-lg" onClick={handleCheckIn} disabled={loading}>
          {loading ? "Fetching..." : "Check In"}
        </button>

</center>
     
        {checkedIn && timestamp && (
          <div className="date-time-box">
            Date : {formatDate(timestamp)}
            <br />
            Time : {formatTime(timestamp)} (IST)
            {gps && (
              <>
                <br />
                Location : {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
              </>
            )}
          </div>
        )}

        <button
          className="btn-white-lg"
          style={{ alignSelf: "center", opacity: checkedIn ? 1 : 0.5 }}
          disabled={!checkedIn}
          onClick={handleNext}
        >
          NEXT
        </button>

        <div className="guidelines-box">
          <div className="guidelines-title">Check-In Guidelines</div>
          <ul className="guidelines-list">
            {CHECKIN_GUIDELINES.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="footer-tag white" style={{ marginTop: "auto" }}>
          One Mission, One Platform
        </div>
      </div>

      <style jsx>{`
        .card-red {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .header-white {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .date-time-box {
          text-align: center;
        }
        .guidelines-box {
          margin-top: 28px;
          width: 100%;
          max-width: 340px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 16px;
          padding: 18px 20px;
          text-align: center;
        }
        .guidelines-title {
          color: #fff;
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
        .footer-tag.white {
          text-align: center;
        }
      `}</style>
      <BottomNav />
    </>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmContent />
    </Suspense>
  );
}