"use client";

import BottomNav from "@/components/BottomNav";

export default function AboutSpiplTechPage() {
  return (
    <>
      <div className="header-white">
        <div className="brand-red">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub-red">By SPIPL Tech™</div>
        <div className="title-red">About SPIPL Tech™</div>
      </div>

      <div className="card-red" style={{ paddingBottom: 90 }}>
        <div style={{ color: "#ede6e6", fontSize: 15, lineHeight: 1.6 }}>
          <p>
            <strong>SPIPL Tech</strong> is the software development and IT
            services division of <strong>Soft Polynomials India Pvt. Ltd.</strong>,
            founded in <strong>1998</strong> by{" "}
            <strong>Hon. Mr. Shashikant Deshpande</strong>. With{" "}
            <strong>28 years</strong> of excellence, the company has grown
            into a trusted technology partner, delivering high-quality
            software solutions and IT services. SPIPL Tech specializes in
            custom software development, web and mobile applications,
            AI-powered solutions, cloud technologies, and enterprise
            software, helping organizations accelerate their digital
            transformation with innovative and scalable solutions.
          </p>
        </div>

        <div className="footer-tag white" style={{ marginTop: "auto" }}>
          One Mission, One Platform
        </div>
      </div>

      <BottomNav />
    </>
  );
}