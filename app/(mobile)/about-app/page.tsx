"use client";

import BottomNav from "@/components/BottomNav";

export default function AboutAppPage() {
  return (
    <>
      <div className="header-white">
        <div className="brand-red">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub-red">By SPIPL Tech™</div>
        <div className="title-red">About App</div>
      </div>

      <div className="card-red" style={{ paddingBottom: 90 }}>
        <div style={{ color: "#e9e4e4", fontSize: 15, lineHeight: 1.6 }}>
          <p>
            ImpactOne™ is a smart field visit and reporting platform developed
            by SPIPL Tech to streamline on-site operations and improve
            productivity. The app enables users to capture real-time geotagged
            photos and videos, submit visit reports instantly, and provide
            location-based proof of work. Administrators can monitor field
            activities, track team performance, view reports on an
            interactive map, and generate insightful analytics for smarter
            decision-making.
          </p>
          <p style={{ marginTop: 16 }}>Developed &amp; Licensed by SPIPL Tech</p>
          <p>© 2026 SPIPL Tech. All Rights Reserved</p>
        </div>

        <div className="footer-tag white" style={{ marginTop: "auto" }}>
          One Mission, One Platform
        </div>
      </div>

      <BottomNav />
    </>
  );
}