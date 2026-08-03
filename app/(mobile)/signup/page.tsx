"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import alcData from "@/data/alcs.json";

const ROLES = ["ALC", "Intern"];

type AlcCenter = {
  code: string;
  name: string;
  areaType: string;
  category: string;
  taluka: string;
};

type AlcMap = Record<string, AlcCenter[]>;

const ALCS: AlcMap = alcData as AlcMap;

// Maps the first 4 digits of the MKCL email to a district
const MKCL_PREFIX_DISTRICT: Record<string, string> = {
  "1421": "Nagpur",
  "2421": "Wardha",
  "3421": "Chandrapur",
  "4421": "Bhandara",
  "5421": "Gondiya",
  "6421": "Gadchiroli",
};

const MKCL_EMAIL_REGEX = /^(\d{8})@mkcl\.org$/i;

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");

  // step 2
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // step 3
  const [alcCenter, setAlcCenter] = useState("");
  const [alcSearch, setAlcSearch] = useState("");
  const [alcDropdownOpen, setAlcDropdownOpen] = useState(false);
  const [role, setRole] = useState("");

  const centersForDistrict = useMemo(() => {
    if (!district) return [];
    return ALCS[district] || [];
  }, [district]);

  const filteredCenters = useMemo(() => {
    if (!alcSearch.trim()) return centersForDistrict;
    const q = alcSearch.toLowerCase();
    return centersForDistrict.filter(
      (c) => c.name.toLowerCase().includes(q) || c.taluka.toLowerCase().includes(q)
    );
  }, [centersForDistrict, alcSearch]);

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName || !email || !phone) {
      setError("Please fill all fields");
      return;
    }

    const match = email.trim().match(MKCL_EMAIL_REGEX);
    if (!match) {
      setError("Email must be in the format ________@mkcl.org (8 digits before @mkcl.org)");
      return;
    }

    const prefix = match[1].slice(0, 4);
    const detectedDistrict = MKCL_PREFIX_DISTRICT[prefix];
    if (!detectedDistrict) {
      setError("Email code does not match any known district");
      return;
    }

    setDistrict(detectedDistrict);
    setStep(2);
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setStep(3);
  }

  function selectAlcCenter(c: AlcCenter) {
    setAlcCenter(c.code);
    setAlcSearch(`(${c.code}) - ${c.name} (${c.taluka})`);
    setAlcDropdownOpen(false);
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please choose role");
      return;
    }
    if (role === "ALC" && !alcCenter) {
      setError("Please choose an ALC center");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          username: email,
          password,
          district,
          alcCenter,
          role,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      setStep(4);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {step !== 4 && (
        <div className="screen-header short">
          <div className="brand">
            impactOne<sup>™</sup>
          </div>
          <div className="brand-sub">By SPIPL Tech™</div>
          <div className="screen-title">SIGN UP</div>
        </div>
      )}

      <div className="screen-body">

      {step === 1 && (
        <form className="form-area" onSubmit={handleStep1}>
          {error && <div className="error-text">{error}</div>}
          <input
            className="field"
            placeholder="ALC Coordinator Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            className="field"
            type="email"
            placeholder="________@mkcl.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="field"
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button type="submit" className="btn-outline">
            NEXT
          </button>
          <div className="switch-text">
            Already have an Account? <Link href="/login">Login</Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <form className="form-area" onSubmit={handleStep2}>
          {error && <div className="error-text">{error}</div>}
          <input className="field" value={email} disabled readOnly />
          <div style={{ fontSize: 12.5, color: "#888", marginTop: -8, marginBottom: 4 }}>
            This will be your username
          </div>
          <input
            className="field"
            type="password"
            placeholder="Choose Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="field"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit" className="btn-outline">
            NEXT
          </button>
          <div className="switch-text">
            Already have an Account? <Link href="/login">Login</Link>
          </div>
        </form>
      )}

      {step === 3 && (
        <form className="form-area" onSubmit={handleStep3}>
          {error && <div className="error-text">{error}</div>}

          <input className="field" value={district} disabled readOnly />

          {/* Searchable ALC Center dropdown */}
          <div className="select-wrap" style={{ position: "relative" }}>
            <input
              className="field"
              placeholder="Search ALC Center..."
              value={alcSearch}
              onChange={(e) => {
                setAlcSearch(e.target.value);
                setAlcCenter("");
                setAlcDropdownOpen(true);
              }}
              onFocus={() => setAlcDropdownOpen(true)}
              onBlur={() => setTimeout(() => setAlcDropdownOpen(false), 150)}
            />
            {alcDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "105%",
                  left: 0,
                  right: 0,
                  maxHeight: 220,
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  zIndex: 20,
                }}
              >
                {filteredCenters.length === 0 && (
                  <div style={{ padding: "10px 14px", color: "#999", fontSize: 13 }}>
                    No ALC center found
                  </div>
                )}
                {filteredCenters.slice(0, 50).map((c) => (
                  <div
                    key={c.code}
                    onMouseDown={() => selectAlcCenter(c)}
                    style={{
                      padding: "10px 14px",
                      fontSize: 13.5,
                      color: "#333",
                      cursor: "pointer",
                      borderBottom: "1px solid #f5f5f5",
                    }}
                  >
                    ({c.code}) - {c.name} <span style={{ color: "#999" }}>({c.taluka})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="select-wrap">
            <select
              className="select-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Choose Role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-outline" disabled={loading}>
            {loading ? "..." : "SIGN UP"}
          </button>
          <div className="switch-text">
            Already have an Account? <Link href="/login">Login</Link>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="success-screen">
          <h2>
            Your Account
            <br />
            Creation Request
            <br />
            Successfully Submitted.
            <br />
            Whenever Admin Approve
            <br />
            You&apos;ll Receive mail
          </h2>
          <div className="check-circle">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

        <div className="footer-tag">One Mission, One Platform</div>
      </div>
    </>
  );
}