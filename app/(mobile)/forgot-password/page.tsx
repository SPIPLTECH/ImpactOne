"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ---- Step 1: send OTP ----
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your registered email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }
      setStep(2);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 2: verify OTP ----
  function handleOtpChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6 digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-otp", email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid OTP");
        return;
      }
      setStep(3);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 3: reset password ----
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newPassword || !confirmPassword) {
      setError("Please fill both fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email,
          otp: otp.join(""),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to reset password");
        return;
      }
      setStep(4);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 4) {
    return (
      <div className="success-screen-red">
        <h2>
          Your Password is
          <br />
          Successfully Changed.
          <br />
          Kindly Login Below
        </h2>
        <div className="check-circle-white">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#e8003f"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <button className="btn-white" onClick={() => router.push("/login")}>
          LOG IN
        </button>
        <div className="footer-tag white">One Mission, One Platform</div>
      </div>
    );
  }

  return (
    <>
      <div className="screen-header short">
        <div className="brand">
          impactOne<sup>™</sup>
        </div>
        <div className="brand-sub">By SPIPL Tech™</div>
        <div className="screen-title">
          {step === 1 && "Forgot Password?"}
          {step === 2 && "Verify"}
          {step === 3 && "Reset Password"}
        </div>
      </div>


      <div className="screen-body">
        {step === 1 && (
          <form className="form-area" onSubmit={handleSendOtp}>
            {error && <div className="error-text">{error}</div>}
            <input
              className="field"
              type="email"
              placeholder="Enter Registered Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-outline" disabled={loading}>
              {loading ? "..." : "SEND OTP"}
            </button>
            <div className="switch-text">
              Remember Password? <Link href="/login">LOGIN</Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="form-area" onSubmit={handleVerifyOtp}>
            {error && <div className="error-text">{error}</div>}
            <div className="otp-hint">Enter 6 digit OTP Sent to {email}</div>

            <div className="otp-row">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  className="otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>

            <button type="submit" className="btn-outline" disabled={loading}>
              {loading ? "..." : "VERIFY"}
            </button>
            <div className="switch-text">
              Remember Password? <Link href="/login">LOGIN</Link>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="form-area" onSubmit={handleReset}>
            {error && <div className="error-text">{error}</div>}
            <input
              className="field"
              type="password"
              placeholder="Choose New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              className="field"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit" className="btn-outline small" disabled={loading}>
              {loading ? "..." : "RESET"}
            </button>
            <div className="switch-text">
              Remember Password? <Link href="/login">LOGIN</Link>
            </div>
          </form>
        )}

        <div className="footer-tag">One Mission, One Platform</div>
      </div>
    </>
  );
}
