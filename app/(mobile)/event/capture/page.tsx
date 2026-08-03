"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VideoCapture from "@/components/VideoCapture";
import { reverseGeocode } from "@/lib/watermark";
import { uploadToCloudinaryDirect } from "@/lib/cloudinaryClient";
import BottomNav from "@/components/BottomNav";

const EVENT_META: Record<string, { title: string; countLabel: string }> = {
  "student-session": { title: "Student Session", countLabel: "How many students were present?" },
  "parent-meeting": { title: "Parent Meeting", countLabel: "How many parents were present?" },
  "teacher-orientation": { title: "Teacher Orientation", countLabel: "How many teachers were present?" },
};

// Each option's "weight" toward completing a school's Student Session
// requirement (3 total). Combine alone satisfies it in one submission;
// every other option (single or pair) counts as 1, so 3 submissions of
// those are needed to reach the same requirement.
const CLASS_OPTIONS = [
  { label: "8th Std", weight: 1 },
  { label: "9th Std", weight: 1 },
  { label: "10th Std", weight: 1 },
  { label: "8th & 9th Std", weight: 1 },
  { label: "9th & 10th Std", weight: 1 },
  { label: "8th & 10th Std", weight: 1 },
  { label: "Combine (8th, 9th & 10th)", weight: 3 },
];

const CONDUCTED_AT_OPTIONS = ["School", "Self Authorized Learning Center (SALC)"];

// What was actually conducted during a Teacher Orientation / Parent
// Meeting visit. Picking the "+" option credits BOTH events for that
// school visit (handled server-side by creating two submissions).
const SESSION_TYPE_OPTIONS: Record<string, string[]> = {
  "teacher-orientation": ["Teacher Orientation", "Teacher Orientation + Parent Meeting"],
  "parent-meeting": ["Parent Meeting", "Parent Meeting + Teacher Orientation"],
};

function CaptureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") || "";
  const prefillSchool = searchParams.get("instituteName") || "";
  const meta = EVENT_META[eventId] || { title: "Event", countLabel: "How many were present?" };
  const isStudentSession = eventId === "student-session";
  const isTeacherOrParent = eventId === "teacher-orientation" || eventId === "parent-meeting";

  const [district, setDistrict] = useState("");
  const [alcCenterCode, setAlcCenterCode] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const [instituteName, setInstituteName] = useState(prefillSchool);

  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [classOfStudents, setClassOfStudents] = useState("");
  const [conductedAt, setConductedAt] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [presentCount, setPresentCount] = useState("");
  const [teacherCount, setTeacherCount] = useState("");
  const [parentCount, setParentCount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isCombinedSession = isTeacherOrParent && sessionType.includes("+");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setDistrict(d.user?.district || "");
        setAlcCenterCode(d.user?.alcCenterCode || "");
      });
    fetch("/api/alc/schools")
      .then((r) => r.json())
      .then((d) => setSchoolOptions(d.schools || []));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const g = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) };
        setGps(g);
        reverseGeocode(g.lat, g.lng).then((addr) => setAddress(addr));
      });
    }
  }, []);

  async function handleSubmit() {
    setError("");
    if (!instituteName) {
      setError("Please select the school this event belongs to");
      return;
    }
    if (!capturedUrl || !videoBlob) {
      setError("Please record the video (10s)");
      return;
    }
    if (isStudentSession && !classOfStudents) {
      setError("Please select which standard(s) this session was for");
      return;
    }
    if (isTeacherOrParent && !conductedAt) {
      setError("Please select where this was conducted");
      return;
    }
    if (isTeacherOrParent && !sessionType) {
      setError("Please select what was conducted");
      return;
    }
    if (isCombinedSession) {
      if (!teacherCount || Number(teacherCount) <= 0) {
        setError("Please enter how many teachers were present");
        return;
      }
      if (!parentCount || Number(parentCount) <= 0) {
        setError("Please enter how many parents were present");
        return;
      }
    } else if (!presentCount || Number(presentCount) <= 0) {
      setError(meta.countLabel);
      return;
    }

    setLoading(true);
    try {
      const videoUrl = await uploadToCloudinaryDirect(
        videoBlob,
        "video",
        "impactone/events",
        `${eventId}_${Date.now()}`
      );

      const res = await fetch("/api/event/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: eventId,
          instituteName,
          classOfStudents: isStudentSession ? classOfStudents : undefined,
          conductedAt: isTeacherOrParent ? conductedAt : undefined,
          sessionType: isTeacherOrParent ? sessionType : undefined,
          presentCount: isCombinedSession ? undefined : presentCount,
          teacherCount: isCombinedSession ? teacherCount : undefined,
          parentCount: isCombinedSession ? parentCount : undefined,
          district,
          alcCenterCode,
          gps,
          videoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Submission failed");
        return;
      }
      router.push("/dashboard");
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
          <div className="screen-title">{meta.title}</div>
        </div>

        <div className="screen-body">
          {error && <div className="error-text">{error}</div>}

          <div className="form-area">
            <div className="detail-label">Which School/Institute is this event for?</div>
            <div className="select-wrap">
              <select
                className="select-field"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
              >
                <option value="">Choose school</option>
                {prefillSchool && !schoolOptions.includes(prefillSchool) && (
                  <option value={prefillSchool}>{prefillSchool}</option>
                )}
                {schoolOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="gps-text">
              📍 {gps ? `GPS: ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)} (accuracy: ${gps.accuracy}m)` : "Fetching GPS..."}
            </div>

            <VideoCapture
              label="Event Video"
              captured={capturedUrl}
              gps={gps}
              address={address}
              onCaptured={(url, blob) => {
                setCapturedUrl(url);
                setVideoBlob(blob);
              }}
              onRetake={() => {
                setCapturedUrl(null);
                setVideoBlob(null);
              }}
            />

            {capturedUrl && (
              <>
                {isStudentSession && (
                  <>
                    <div className="detail-label">Which standard was this session for?</div>
                    <div className="select-wrap">
                      <select
                        className="select-field"
                        value={classOfStudents}
                        onChange={(e) => setClassOfStudents(e.target.value)}
                      >
                        <option value="">Choose standard</option>
                        {CLASS_OPTIONS.map((c) => (
                          <option key={c.label} value={c.label}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {isTeacherOrParent && (
                  <>
                    <div className="detail-label">Where was this conducted?</div>
                    <div className="select-wrap">
                      <select
                        className="select-field"
                        value={conductedAt}
                        onChange={(e) => setConductedAt(e.target.value)}
                      >
                        <option value="">Choose location</option>
                        {CONDUCTED_AT_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="detail-label">What did you conduct?</div>
                    <div className="select-wrap">
                      <select
                        className="select-field"
                        value={sessionType}
                        onChange={(e) => setSessionType(e.target.value)}
                      >
                        <option value="">Choose one</option>
                        {SESSION_TYPE_OPTIONS[eventId]?.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {isCombinedSession ? (
                  <>
                    <div className="detail-label">How many teachers were present?</div>
                    <input
                      className="field"
                      type="number"
                      min={1}
                      placeholder="Enter teacher count"
                      value={teacherCount}
                      onChange={(e) => setTeacherCount(e.target.value)}
                    />

                    <div className="detail-label">How many parents were present?</div>
                    <input
                      className="field"
                      type="number"
                      min={1}
                      placeholder="Enter parent count"
                      value={parentCount}
                      onChange={(e) => setParentCount(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <div className="detail-label">{meta.countLabel}</div>
                    <input
                      className="field"
                      type="number"
                      min={1}
                      placeholder="Enter the count"
                      value={presentCount}
                      onChange={(e) => setPresentCount(e.target.value)}
                    />
                  </>
                )}
              </>
            )}

            <button className="btn-red-solid" onClick={handleSubmit} disabled={!capturedUrl || loading}>
              {loading ? "..." : "SUBMIT"}
            </button>
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
        .screen-header.short {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
      `}</style>
    </>
  );
}

export default function EventCapturePage() {
  return (
    <Suspense fallback={null}>
      <CaptureContent />
    </Suspense>
  );
}