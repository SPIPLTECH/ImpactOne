"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { drawWatermarkOverlay, reverseGeocode } from "@/lib/watermark";
import BottomNav from "@/components/BottomNav";

type Gps = { lat: number; lng: number; accuracy: number };

function buildCheckinWatermarkLines(
  gps: Gps | null,
  address: string | null,
  checkinDate: Date | null
): string[] {
  const lines: string[] = [];
  if (address) lines.push(address);
  if (gps) {
    lines.push(
      `Lat: ${gps.lat.toFixed(6)}  Long: ${gps.lng.toFixed(6)} (±${gps.accuracy}m)`
    );
  }
  if (checkinDate) {
    const dayStr = checkinDate.toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
    const dateStr = checkinDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
    const timeStr = checkinDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" });
    lines.push(`${dayStr}, ${dateStr}  ${timeStr} (IST)`);
  }
  return lines;
}

function DetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const district = searchParams.get("district") || "";
  const alc = searchParams.get("alc") || "";

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const accuracyParam = searchParams.get("accuracy");
  const checkinTimeParam = searchParams.get("checkinTime");

  const gps: Gps | null =
    latParam && lngParam
      ? { lat: parseFloat(latParam), lng: parseFloat(lngParam), accuracy: accuracyParam ? Math.round(parseFloat(accuracyParam)) : 0 }
      : null;

  const checkinDate = checkinTimeParam ? new Date(checkinTimeParam) : null;

  const [instituteName, setInstituteName] = useState("");
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const schoolWrapRef = useRef<HTMLDivElement | null>(null);

  const [gpsError, setGpsError] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Live camera state — no file picker / gallery is ever involved.
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!gps) {
      setGpsError("Location not found — please go back and Check In again");
      return;
    }
    reverseGeocode(gps.lat, gps.lng).then((addr) => setAddress(addr));
    fetch("/api/alc/schools")
      .then((r) => r.json())
      .then((d) => setSchoolOptions(d.schools || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (schoolWrapRef.current && !schoolWrapRef.current.contains(e.target as Node)) {
        setSchoolDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Always stop the camera stream when leaving this screen/component.
  useEffect(() => {
    return () => stopCameraStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSchools = schoolOptions.filter((s) =>
    s.toLowerCase().includes(schoolSearch.trim().toLowerCase())
  );

  function stopCameraStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function handleTakePhoto() {
    setError("");
    setCameraError("");
    if (!gps) {
      setError("Location not found — please go back and Check In again");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera is not supported on this device/browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // video element mounts on next render — attach stream right after
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCameraError(
        "Camera access was denied. Please allow Camera permission for this site and try again."
      );
    }
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const lines = buildCheckinWatermarkLines(gps, address, checkinDate);
    drawWatermarkOverlay(ctx, canvas.width, canvas.height, lines);
    setPhoto(canvas.toDataURL("image/jpeg", 0.9));
    stopCameraStream();
    setCameraOpen(false);
  }

  function handleCancelCamera() {
    stopCameraStream();
    setCameraOpen(false);
  }

  function handleRetake() {
    setPhoto(null);
    handleTakePhoto();
  }

  async function handleSubmit() {
    setError("");
    if (!instituteName) {
      setError("Please select or enter School/Institute Name");
      return;
    }
    if (!gps) {
      setError("Location not found — please go back and Check In again");
      return;
    }
    if (!photo) {
      setError("Please capture a photo of the institute gate");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, alc, instituteName, gps, photo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Submission failed");
        return;
      }
      router.push(`/event?instituteName=${encodeURIComponent(instituteName)}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-scroll">
        <div className="screen-header short">
          <div className="brand">
            impactOne<sup>™</sup>
          </div>
          <div className="brand-sub">By SPIPL Tech™</div>
          <div className="screen-title">Fill the Details Carefully</div>
        </div>

        <div className="screen-body">
          {error && <div className="error-text">{error}</div>}
          {cameraError && <div className="error-text">{cameraError}</div>}

          <div className="form-area">
            <div className="detail-label">School/Institute Name</div>

            <div style={{ fontSize: "12.5px", color: "#555", marginBottom: "4px", lineHeight: "1.5" }}>
              <strong>First visit?</strong> Enter the school name manually.
              <br />
              <strong>Already visited?</strong> Select the school from the list below.
            </div>

            <div className="select-wrap" ref={schoolWrapRef} style={{ position: "relative" }}>
              <input
                className="field"
                type="text"
                placeholder="Choose a previous school or type a new one"
                value={schoolDropdownOpen ? schoolSearch : instituteName}
                onFocus={() => {
                  setSchoolDropdownOpen(true);
                  setSchoolSearch(instituteName);
                }}
                onChange={(e) => {
                  setSchoolSearch(e.target.value);
                  setInstituteName(e.target.value);
                }}
                autoComplete="off"
              />
              {schoolDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#fff",
                    borderRadius: 10,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                    zIndex: 20,
                  }}
                >
                  {filteredSchools.length === 0 && (
                    <div style={{ padding: "10px 14px", color: "#999", fontSize: 14 }}>
                      {schoolSearch ? "No match — this will be added as a new school" : "No previous schools yet"}
                    </div>
                  )}
                  {filteredSchools.map((s) => (
                    <div
                      key={s}
                      onClick={() => {
                        setInstituteName(s);
                        setSchoolDropdownOpen(false);
                      }}
                      style={{ padding: "10px 14px", fontSize: 14, color: "#222", cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!photo && !cameraOpen && (
              <>
                <div className="detail-sub">Capture photo in front of School/Institute Gate</div>
                <div className="gps-text">
                  <span className="dot">📍</span>{" "}
                  {gps
                    ? `GPS: ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} (accuracy: ${gps.accuracy}m)`
                    : gpsError || "Loading location from check-in..."}
                </div>

                <button className="btn-red-solid" onClick={handleTakePhoto}>
                  Take Photo
                </button>
                <div className="hint-small">Opens live camera — capture only, no gallery upload</div>
              </>
            )}

            {cameraOpen && (
              <>
                <div className="camera-preview">
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 12 }} />
                </div>
                <button className="btn-red-solid" onClick={handleCapture}>
                  Capture
                </button>
                <button className="retake-link" onClick={handleCancelCamera}>
                  Cancel
                </button>
              </>
            )}

            {photo && !cameraOpen && (
              <>
                <div className="gps-text">
                  <span className="dot">📍</span>{" "}
                  {gps && `GPS: ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} (accuracy: ${gps.accuracy}m)`}
                </div>

                <div className="camera-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Captured" />
                </div>

                <div className="success-pill">✅ Your Image Successfully Captured</div>

                <button className="retake-link" onClick={handleRetake}>
                  Re-Take Photo
                </button>

                <button className="btn-red-solid" onClick={handleSubmit} disabled={loading}>
                  {loading ? "..." : "SUBMIT"}
                </button>
              </>
            )}
          </div>

          <div className="footer-tag">One Mission, One Platform</div>
        </div>
      </div>

      <BottomNav />

      <style jsx>{`
        .page-scroll {
          min-height: 100dvh;
          height: auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: calc(90px + env(safe-area-inset-bottom));
          box-sizing: border-box;
        }
      `}</style>
    </>
  );
}
export default function DetailsPage() {
  return (
    <Suspense fallback={null}>
      <DetailsContent />
    </Suspense>
  );
}