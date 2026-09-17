"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { uploadToCloudinaryDirect } from "@/lib/cloudinaryClient";
import DcuShell from "../_components/DcuShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

// The global .field / .select-field classes use a dark gradient background
// with white text (built for the mobile app's login-style screens). That
// combination is unreadable inside a native <select> dropdown, whose option
// list always renders on the browser's own white background. Override with
// a plain light style here so this admin form stays readable.
const LIGHT_FIELD_STYLE: React.CSSProperties = { background: "#fff", color: "#222", border: "1px solid #ddd" };

const EVENT_TYPE_OPTIONS = [
  { value: "student-session", label: "Student Session" },
  { value: "teacher-orientation", label: "Teacher Orientation" },
  { value: "parent-meeting", label: "Parent Meeting" },
  { value: "mom", label: "MOM" },
  { value: "parikshela-jata-jata", label: "Parikshela Jata Jata" },
  { value: "others", label: "Others" },
];

const CLASS_OPTIONS = [
  "8th Std",
  "9th Std",
  "10th Std",
  "8th & 9th Std",
  "9th & 10th Std",
  "8th & 10th Std",
  "Combine (8th, 9th & 10th)",
  "11th",
  "12th",
  "Combine (11th & 12th)",
];

const CONDUCTED_AT_OPTIONS = ["School", "Self Authorized Learning Center (SALC)"];
const SESSION_TYPES: Record<string, string[]> = {
  "teacher-orientation": ["Teacher Orientation", "Teacher Orientation + Parent Meeting"],
  "parent-meeting": ["Parent Meeting", "Parent Meeting + Teacher Orientation"],
};

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AddMissingDataPage() {
  const router = useRouter();

  const [alcs, setAlcs] = useState<AnyRow[]>([]);
  const [alcSearch, setAlcSearch] = useState("");
  const [selectedAlcId, setSelectedAlcId] = useState("");
  const [schools, setSchools] = useState<string[]>([]);
  const [loadingAlcs, setLoadingAlcs] = useState(false);

  const [includeCheckin, setIncludeCheckin] = useState(true);
  const [includeEvent, setIncludeEvent] = useState(true);

  // Check-in fields
  const [ciSchool, setCiSchool] = useState("");
  const [ciDateTime, setCiDateTime] = useState(() => toDatetimeLocal(new Date()));
  const [ciLat, setCiLat] = useState("");
  const [ciLng, setCiLng] = useState("");
  const [ciPhotoUrl, setCiPhotoUrl] = useState("");
  const [ciUploading, setCiUploading] = useState(false);

  // Event fields
  const [evSchool, setEvSchool] = useState("");
  const [evDateTime, setEvDateTime] = useState(() => toDatetimeLocal(new Date()));
  const [evType, setEvType] = useState("student-session");
  const [evClass, setEvClass] = useState("");
  const [evSpecify, setEvSpecify] = useState("");
  const [evConductedAt, setEvConductedAt] = useState("");
  const [evSessionType, setEvSessionType] = useState("");
  const [evPresentCount, setEvPresentCount] = useState("");
  const [evTeacherCount, setEvTeacherCount] = useState("");
  const [evParentCount, setEvParentCount] = useState("");
  const [evVideoUrl, setEvVideoUrl] = useState("");
  const [evUploading, setEvUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCombinedSession = evSessionType.includes("+");
  const needsSessionType = evType === "teacher-orientation" || evType === "parent-meeting";

  const loadAlcs = useCallback(async () => {
    setLoadingAlcs(true);
    try {
      const res = await fetch("/api/dcu/add-missing-data");
      if (res.status === 401) return router.push("/admin/login");
      const data = await res.json();
      setAlcs(data.users || []);
    } finally {
      setLoadingAlcs(false);
    }
  }, [router]);

  useEffect(() => {
    loadAlcs();
  }, [loadAlcs]);

  useEffect(() => {
    if (!selectedAlcId) {
      setSchools([]);
      return;
    }
    fetch(`/api/dcu/add-missing-data?alcUserId=${selectedAlcId}`)
      .then((r) => r.json())
      .then((d) => setSchools(d.schools || []))
      .catch(() => setSchools([]));
  }, [selectedAlcId]);

  const filteredAlcs = useMemo(() => {
    const q = alcSearch.trim().toLowerCase();
    if (!q) return alcs;
    return alcs.filter(
      (a) =>
        (a.fullName || "").toLowerCase().includes(q) ||
        (a.username || "").toLowerCase().includes(q) ||
        (a.alcCenterName || "").toLowerCase().includes(q) ||
        (a.alcCenterCode || "").toLowerCase().includes(q)
    );
  }, [alcs, alcSearch]);

  const selectedAlc = alcs.find((a) => a._id === selectedAlcId);

  async function handleCiPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setCiUploading(true);
    try {
      const url = await uploadToCloudinaryDirect(file, "image", "impactone/checkins", `dcu_checkin_${Date.now()}`);
      setCiPhotoUrl(url);
    } catch {
      setError("Check-in photo upload failed, please try again");
    } finally {
      setCiUploading(false);
    }
  }

  async function handleEvVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setEvUploading(true);
    try {
      const url = await uploadToCloudinaryDirect(file, "video", "impactone/events", `dcu_event_${Date.now()}`);
      setEvVideoUrl(url);
    } catch {
      setError("Event video upload failed, please try again");
    } finally {
      setEvUploading(false);
    }
  }

  function resetForm() {
    setCiSchool("");
    setCiDateTime(toDatetimeLocal(new Date()));
    setCiLat("");
    setCiLng("");
    setCiPhotoUrl("");
    setEvSchool("");
    setEvDateTime(toDatetimeLocal(new Date()));
    setEvType("student-session");
    setEvClass("");
    setEvSpecify("");
    setEvConductedAt("");
    setEvSessionType("");
    setEvPresentCount("");
    setEvTeacherCount("");
    setEvParentCount("");
    setEvVideoUrl("");
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!selectedAlcId) {
      setError("Please search and select the ALC/Intern this data belongs to");
      return;
    }
    if (!includeCheckin && !includeEvent) {
      setError("Select at least Check-in or Event to add");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: AnyRow = { alcUserId: selectedAlcId };

    if (includeCheckin) {
      if (!ciSchool.trim()) return setError("Enter/select the school for the check-in");
      if (!ciPhotoUrl) return setError("Upload the check-in photo");
      payload.checkin = {
        instituteName: ciSchool.trim(),
        photoUrl: ciPhotoUrl,
        gps: { lat: ciLat, lng: ciLng },
        occurredAt: ciDateTime ? new Date(ciDateTime).toISOString() : undefined,
      };
    }

    if (includeEvent) {
      if (!evSchool.trim()) return setError("Enter/select the school for the event");
      if (!evVideoUrl) return setError("Upload the event video");
      payload.event = {
        eventType: evType,
        instituteName: evSchool.trim(),
        classOfStudents: evType === "student-session" ? evClass : undefined,
        specifyEvent: evType === "others" ? evSpecify : undefined,
        conductedAt: needsSessionType ? evConductedAt : undefined,
        sessionType: needsSessionType ? evSessionType : undefined,
        presentCount: needsSessionType && isCombinedSession ? undefined : evPresentCount,
        teacherCount: needsSessionType && isCombinedSession ? evTeacherCount : undefined,
        parentCount: needsSessionType && isCombinedSession ? evParentCount : undefined,
        videoUrl: evVideoUrl,
        occurredAt: evDateTime ? new Date(evDateTime).toISOString() : undefined,
      };
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/dcu/add-missing-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Submission failed");
        return;
      }
      setSuccess(
        "Added successfully. It's now sitting in Check-in Submissions / Event Submissions as Pending — approve it there and the counts, school completion and analytics graphs will update immediately."
      );
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DcuShell title="Add ALC Missing Data" activeKey="add-missing-data">
      <div className="admin-panel-block" style={{ marginBottom: 16 }}>
        <p style={{ color: "#666", fontSize: 13.5, marginTop: 0 }}>
          Use this when an ALC/Intern forgot to submit a check-in or event from the app, but has already sent you the
          photo / video. Pick them below, fill the same details they would have entered, and upload their file — it
          goes into the normal <strong>Pending</strong> review queue exactly like a self-submission, so approving it
          updates their school completion, payment eligibility and analytics the same way.
        </p>

        <label className="hint-small" style={{ display: "block", marginBottom: 4 }}>Search ALC / Intern</label>
        <input
          className="field"
          placeholder="Search by name, username, ALC center name or code..."
          value={alcSearch}
          onChange={(e) => setAlcSearch(e.target.value)}
          style={{ ...LIGHT_FIELD_STYLE, marginBottom: 8 }}
        />
        <select
          className="select-field"
          style={{ ...LIGHT_FIELD_STYLE, width: "100%" }}
          value={selectedAlcId}
          onChange={(e) => setSelectedAlcId(e.target.value)}
        >
          <option value="">{loadingAlcs ? "Loading ALC/Intern list..." : "-- Select ALC / Intern --"}</option>
          {filteredAlcs.map((a) => (
            <option key={a._id} value={a._id}>
              {a.fullName || a.username} — {a.alcCenterName || "No ALC Center"} ({a.alcCenterCode || "-"}) [{a.role}]
            </option>
          ))}
        </select>

        {selectedAlc && (
          <div className="success-pill" style={{ marginTop: 10 }}>
            Selected: {selectedAlc.fullName || selectedAlc.username} · {selectedAlc.alcCenterName || "-"} ·{" "}
            {selectedAlc.district}
          </div>
        )}
      </div>

      {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
      {success && <div className="success-pill" style={{ marginBottom: 10, display: "block" }}>{success}</div>}

      {selectedAlcId && (
        <>
          {/* ---------------- Check-in ---------------- */}
          <div className="admin-panel-block" style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, marginBottom: 10 }}>
              <input type="checkbox" checked={includeCheckin} onChange={(e) => setIncludeCheckin(e.target.checked)} />
              Add missing Check-in
            </label>

            {includeCheckin && (
              <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
                <div>
                  <label className="hint-small">School / Institute Name</label>
                  <input
                    className="field"
                    style={LIGHT_FIELD_STYLE}
                    list="school-list"
                    placeholder="Select existing or type a new school name"
                    value={ciSchool}
                    onChange={(e) => setCiSchool(e.target.value)}
                  />
                </div>
                <div>
                  <label className="hint-small">Date &amp; Time of check-in</label>
                  <input
                    className="field"
                    style={LIGHT_FIELD_STYLE}
                    type="datetime-local"
                    value={ciDateTime}
                    onChange={(e) => setCiDateTime(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label className="hint-small">Latitude (optional)</label>
                    <input className="field" style={LIGHT_FIELD_STYLE} type="number" step="any" value={ciLat} onChange={(e) => setCiLat(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="hint-small">Longitude (optional)</label>
                    <input className="field" style={LIGHT_FIELD_STYLE} type="number" step="any" value={ciLng} onChange={(e) => setCiLng(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="hint-small">Check-in Photo</label>
                  <input type="file" accept="image/*" onChange={handleCiPhotoChange} />
                  {ciUploading && <div className="hint-small">Uploading photo...</div>}
                  {ciPhotoUrl && !ciUploading && (
                    <div style={{ marginTop: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ciPhotoUrl} alt="Check-in preview" style={{ maxWidth: 220, borderRadius: 8 }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ---------------- Event ---------------- */}
          <div className="admin-panel-block" style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, marginBottom: 10 }}>
              <input type="checkbox" checked={includeEvent} onChange={(e) => setIncludeEvent(e.target.checked)} />
              Add missing Event
            </label>

            {includeEvent && (
              <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
                <div>
                  <label className="hint-small">Event Name</label>
                  <select
                    className="select-field"
                    style={LIGHT_FIELD_STYLE}
                    value={evType}
                    onChange={(e) => {
                      setEvType(e.target.value);
                      setEvClass("");
                      setEvConductedAt("");
                      setEvSessionType("");
                      setEvSpecify("");
                    }}
                  >
                    {EVENT_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {evType === "others" && (
                  <div>
                    <label className="hint-small">Specify Event</label>
                    <input className="field" style={LIGHT_FIELD_STYLE} value={evSpecify} onChange={(e) => setEvSpecify(e.target.value)} placeholder="Type the event name" />
                  </div>
                )}

                <div>
                  <label className="hint-small">School / Institute Name</label>
                  <input
                    className="field"
                    style={LIGHT_FIELD_STYLE}
                    list="school-list"
                    placeholder="Select existing or type a new school name"
                    value={evSchool}
                    onChange={(e) => setEvSchool(e.target.value)}
                  />
                </div>

                <div>
                  <label className="hint-small">Date &amp; Time of event</label>
                  <input className="field" style={LIGHT_FIELD_STYLE} type="datetime-local" value={evDateTime} onChange={(e) => setEvDateTime(e.target.value)} />
                </div>

                {evType === "student-session" && (
                  <div>
                    <label className="hint-small">Class of Students</label>
                    <select className="select-field" style={LIGHT_FIELD_STYLE} value={evClass} onChange={(e) => setEvClass(e.target.value)}>
                      <option value="">-- Select standard(s) --</option>
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {needsSessionType && (
                  <>
                    <div>
                      <label className="hint-small">Conducted At</label>
                      <select className="select-field" style={LIGHT_FIELD_STYLE} value={evConductedAt} onChange={(e) => setEvConductedAt(e.target.value)}>
                        <option value="">-- Select --</option>
                        {CONDUCTED_AT_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="hint-small">What was conducted</label>
                      <select className="select-field" style={LIGHT_FIELD_STYLE} value={evSessionType} onChange={(e) => setEvSessionType(e.target.value)}>
                        <option value="">-- Select --</option>
                        {SESSION_TYPES[evType].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {needsSessionType && isCombinedSession ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label className="hint-small">Teachers Present</label>
                      <input className="field" style={LIGHT_FIELD_STYLE} type="number" min={1} value={evTeacherCount} onChange={(e) => setEvTeacherCount(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="hint-small">Parents Present</label>
                      <input className="field" style={LIGHT_FIELD_STYLE} type="number" min={1} value={evParentCount} onChange={(e) => setEvParentCount(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="hint-small">Present Count</label>
                    <input className="field" style={LIGHT_FIELD_STYLE} type="number" min={1} value={evPresentCount} onChange={(e) => setEvPresentCount(e.target.value)} />
                  </div>
                )}

                <div>
                  <label className="hint-small">Event Video</label>
                  <input type="file" accept="video/*" onChange={handleEvVideoChange} />
                  {evUploading && <div className="hint-small">Uploading video...</div>}
                  {evVideoUrl && !evUploading && (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={evVideoUrl} controls style={{ maxWidth: 260, marginTop: 8, borderRadius: 8, background: "#000" }} />
                  )}
                </div>
              </div>
            )}
          </div>

          <datalist id="school-list">
            {schools.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <button className="btn-red-solid" disabled={submitting || ciUploading || evUploading} onClick={handleSubmit}>
            {submitting ? "Submitting..." : "Submit Missing Data"}
          </button>
        </>
      )}
    </DcuShell>
  );
}