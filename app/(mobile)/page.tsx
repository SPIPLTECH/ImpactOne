"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SLIDES = ["/start1.png", "/start2.png", "/start3.png"];
const AUTOPLAY_MS = 2800;

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landing-screen">
      <div className="landing-header">
        <div className="landing-brand">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub">By SPIPL Tech™</div>
      </div>

      <div className="landing-content">
        <div className="coverflow">
          {SLIDES.map((src, i) => {
            const len = SLIDES.length;
            // Always 0 (center), 1 (right, about to move to center), or len-1 (left, exiting).
            const diff = ((i - active) % len + len) % len;

            let transform = "";
            let opacity = 1;
            let zIndex = 10;
            let filter = "none";

            if (diff === 0) {
              // CHANGE HERE: scale(1) se scale(1.25) kar diya to make it distinctly larger
              transform = "translateX(0%) scale(1.25)";
              zIndex = 30;
            } else if (diff === len - 1) {
              transform = "translateX(-62%) scale(0.82)";
              opacity = 0.55;
              zIndex = 20;
              filter = "brightness(0.8)";
            } else if (diff === 1) {
              transform = "translateX(62%) scale(0.82)";
              opacity = 0.65;
              zIndex = 20;
              filter = "brightness(0.8)";
            } else {
              transform = "translateX(0%) scale(0.6)";
              opacity = 0;
              zIndex = 0;
            }

            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="coverflow-slide"
                style={{ transform, opacity, zIndex, filter }}
              />
            );
          })}
        </div>

        <div className="coverflow-dots">
          {SLIDES.map((src, i) => (
            <button
              key={src}
              className={`coverflow-dot ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button className="btn-primary" onClick={() => router.push("/login")}>
          Get Started
        </button>

        <div className="footer-tag white">One Mission, One Platform</div>
      </div>

      <style jsx>{`
        .landing-screen {
          min-height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          margin: 0;
          padding: 0;
        }
        .landing-header {
          background: linear-gradient(135deg, #f9723c 0%, #e63242 55%, #e0223a 100%);
          border-radius: 0 0 40px 40px;
          padding: 52px 20px 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 8px 24px rgba(224, 34, 58, 0.25);
          width: 100%;
          margin: 0;
        }
        .landing-brand {
          color: #fff;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-align: center;
          line-height: 1.1;
        }
        .landing-header .brand-sub {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-style: italic;
          text-align: center;
          margin-top: 6px;
        }
        .landing-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 26px;
          padding: 28px 20px 40px;
        }
        .coverflow {
          position: relative;
          width: 100%;
          max-width: 340px;
          /* HEIGHT UPDATE: 260px se 310px kar diya taaki badi image fit aa sake */
          height: 310px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .coverflow-slide {
          position: absolute;
          width: 230px;
          height: 230px;
          object-fit: cover;
          border-radius: 20px;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
          transition: transform 0.7s cubic-bezier(0.65, 0, 0.35, 1),
            opacity 0.7s ease, filter 0.7s ease;
          will-change: transform, opacity;
        }
        .coverflow-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        .coverflow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          padding: 0;
          background: #f6c3ba;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .coverflow-dot.active {
          background: #e8452c;
          width: 20px;
          border-radius: 5px;
        }
        .btn-primary {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          padding: 15px 0;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #f9723c 0%, #e0223a 100%);
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(230, 50, 66, 0.3);
        }
        .footer-tag.white {
          color: #e8452c;
          font-size: 15px;
          font-weight: 600;
          text-align: center;
        }
      `}</style>
    </div>
  );
}