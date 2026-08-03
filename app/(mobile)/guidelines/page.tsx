"use client";

import BottomNav from "@/components/BottomNav";

const steps = [
  "Log in to the app using your authorized credentials.",
  "After a successful login, complete the Check-In process.",
  "Enter the correct School/Institute Name and all required details carefully.",
  "Capture a clear geotagged image of the location and submit it.",
  "Select the appropriate Event from the available list.",
  "Record the event clearly as per the instructions and ensure the video is complete.",
  "Review all details before submitting.",
  "Click Submit to complete the visit successfully.",
];

export default function GuidelinesPage() {
  return (
    <>
      <div className="header-white">
        <div className="brand-red">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub-red">By SPIPL Tech™</div>
        <div className="title-red">Guidelines</div>
      </div>

      <div className="card-red" style={{ paddingBottom: 90 }}>
        <ol style={{ color: "#fffcfc", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          {steps.map((step, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              {step}
            </li>
          ))}
        </ol>

        <div className="footer-tag white" style={{ marginTop: "auto" }}>
          One Mission, One Platform
        </div>
      </div>

      <BottomNav />
    </>
  );
}