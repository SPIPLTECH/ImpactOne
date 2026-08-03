"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LineGraph from "@/components/LineGraph";

export default function MentorDashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Mentor");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.username) setUserName(data.user.username);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <>
      <div className="header-white">
        <div className="brand-red">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub-red">By SPIPL Tech™</div>
        <div className="title-red">Hey! {userName}</div>
      </div>

      <div className="card-red">
        <button
          className="btn-white-lg"
          onClick={() => router.push("/checkin/select-alc")}
        >
          Check In
        </button>

        <div className="event-list">
          <button className="event-item">🏫 Assigned ALCs</button>
          <button className="event-item">📝 Visit Reports</button>
        </div>

        <div className="graph-wrap">
          <LineGraph />
        </div>

        <button
          className="retake-link"
          style={{ alignSelf: "center" }}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>

        <div className="footer-tag white" style={{ marginTop: "auto" }}>
          One Mission, One Platform
        </div>
      </div>
    </>
  );
}