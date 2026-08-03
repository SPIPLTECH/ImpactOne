"use client";

import BottomNav from "@/components/BottomNav";
import { useRouter } from "next/navigation";

const USER_NAME = "Test";

export default function EventPage() {
  const router = useRouter();

  return (
    <>
      <div className="header-white">
        <div className="brand-red">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub-red">By SPIPL Tech™</div>
        <div className="title-red">Hey! {USER_NAME}</div>
      </div>

      <div className="card-red">
        <button
          className="btn-white-lg"
          onClick={() => router.push("/event/select")}
        >
          Start Event
        </button>

        <div className="graph-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/event.png" alt="Start Event" className="event-banner" />
        </div>

        <div className="footer-tag white">One Mission, One Platform</div>
      </div>

      <style jsx>{`
        .header-white {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: linear-gradient(135deg, #f9723c 0%, #e63242 55%, #e0223a 100%) !important;
          border-radius: 0 0 32px 32px;
          padding: 32px 20px 40px;
        }
        .card-red {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: #ffffff !important;
        }
        .card-red :global(.btn-white-lg) {
          display: block;
          margin: 0 auto;
          align-self: center;
          background: linear-gradient(135deg, #f9723c 0%, #e0223a 100%) !important;
          color: #fff !important;
          border: none !important;
          box-shadow: 0 10px 20px rgba(230, 50, 66, 0.3);
        }
        .header-white :global(.brand-red),
        .header-white :global(.brand-sub-red),
        .header-white :global(.title-red) {
          color: #ffffff !important;
        }
        .graph-wrap {
          width: 100%;
          max-width: 340px;
          margin-top: 32px;
          display: flex;
          justify-content: center;
        }
        .event-banner {
          width: 100%;
          height: auto;
          border-radius: 16px;
          display: block;
        }
        .footer-tag.white {
          margin-top: 28px;
          text-align: center;
        }
      `}</style>
      <BottomNav />
    </>
  );
}