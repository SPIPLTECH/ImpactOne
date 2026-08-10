"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import alcData from "@/data/alcs.json";
import BottomNav from "@/components/BottomNav";

type AlcCenter = {
  code: string;
  name: string;
  areaType: string;
  category: string;
  taluka?: string;
};

const ALCS: Record<string, AlcCenter[]> = alcData as Record<string, AlcCenter[]>;
const DISTRICTS = Object.keys(ALCS);

const SELECT_ALC_GUIDELINES = [
  "Select the correct District before proceeding.",
  "Choose your assigned ALC Center carefully.",
  "Verify District and ALC details before submitting.",
  "Ensure the selected District and ALC are correct.",
  "Incorrect District or ALC selection may lead to invalid submissions.",
];

export default function SelectAlcPage() {
  const router = useRouter();
  const [district, setDistrict] = useState("");
  const [alcCenter, setAlcCenter] = useState("");
  const [error, setError] = useState("");

  const [alcSearch, setAlcSearch] = useState("");
  const [alcDropdownOpen, setAlcDropdownOpen] = useState(false);
  const alcWrapRef = useRef<HTMLDivElement | null>(null);

  const centersForDistrict = useMemo(() => {
    if (!district) return [];
    return ALCS[district] || [];
  }, [district]);

  const filteredCenters = useMemo(() => {
    if (!alcSearch.trim()) return centersForDistrict;
    const q = alcSearch.trim().toLowerCase();
    return centersForDistrict.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.taluka?.toLowerCase().includes(q) ?? false) ||
        c.code.toLowerCase().includes(q)
    );
  }, [centersForDistrict, alcSearch]);

  const selectedCenter = useMemo(
    () => centersForDistrict.find((c) => c.code === alcCenter) || null,
    [centersForDistrict, alcCenter]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (alcWrapRef.current && !alcWrapRef.current.contains(e.target as Node)) {
        setAlcDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectCenter(c: AlcCenter) {
    setAlcCenter(c.code);
    setAlcSearch("");
    setAlcDropdownOpen(false);
  }

  function handleNext() {
    setError("");
    if (!district || !alcCenter) {
      setError("Please select district and ALC");
      return;
    }
    const params = new URLSearchParams({ district, alc: alcCenter });
    router.push(`/checkin/confirm?${params.toString()}`);
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
        {error && (
          <div className="error-text" style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div className="select-pill-wrap">
          <select
            className="select-pill"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setAlcCenter("");
              setAlcSearch("");
            }}
          >
            <option value="">Select District</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="select-pill-wrap" ref={alcWrapRef} style={{ position: "relative" }}>
          <input
            className="select-pill"
            type="text"
            placeholder={district ? "Search or choose ALC" : "Select district first"}
            value={
              alcDropdownOpen
                ? alcSearch
                : selectedCenter
                ? `(${selectedCenter.code}) - ${selectedCenter.name}${
                    selectedCenter.taluka ? ` (${selectedCenter.taluka})` : ""
                  }`
                : ""
            }
            disabled={!district}
            onFocus={() => {
              setAlcDropdownOpen(true);
              setAlcSearch("");
            }}
            onChange={(e) => setAlcSearch(e.target.value)}
            autoComplete="off"
          />

          {alcDropdownOpen && district && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                maxHeight: 220,
                overflowY: "auto",
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                zIndex: 20,
              }}
            >
              {filteredCenters.length === 0 && (
                <div style={{ padding: "10px 14px", color: "#999", fontSize: 14 }}>
                  No ALC found
                </div>
              )}
              {filteredCenters.map((c) => (
                <div
                  key={c.code}
                  onClick={() => handleSelectCenter(c)}
                  style={{
                    padding: "10px 14px",
                    fontSize: 14,
                    color: "#222",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  ({c.code}) - {c.name}
                  {c.taluka ? ` (${c.taluka})` : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn-white-lg"
          style={{ alignSelf: "center", marginTop: 14 }}
          onClick={handleNext}
        >
          NEXT
        </button>

        <div className="guidelines-box">
          <div className="guidelines-title">Selection Guidelines</div>
          <ul className="guidelines-list">
            {SELECT_ALC_GUIDELINES.map((tip) => (
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
        .card-red {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .select-pill-wrap {
          width: 100%;
          max-width: 340px;
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