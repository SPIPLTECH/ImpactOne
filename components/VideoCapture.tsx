"use client";

import { useEffect, useRef, useState } from "react";
import { buildWatermarkLines, drawWatermarkOverlay, GpsCoords } from "@/lib/watermark";

const DURATION_SEC = 10; // HARD LIMIT — exactly 10 seconds, not more not less

type Props = {
  label: string;
  onCaptured: (blobUrl: string, blob: Blob) => void;
  captured?: string | null;
  onRetake?: () => void;
  gps?: GpsCoords | null;
  address?: string | null;
};

export default function VideoCapture({ label, onCaptured, captured, onRetake, gps, address }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const gpsRef = useRef<GpsCoords | null | undefined>(gps);
  const addressRef = useRef<string | null | undefined>(address);

  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SEC);
  const [error, setError] = useState("");

  useEffect(() => {
    gpsRef.current = gps;
  }, [gps]);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function drawFrameLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const lines = buildWatermarkLines(gpsRef.current || null, addressRef.current || null);
    drawWatermarkOverlay(ctx, canvas.width, canvas.height, lines);

    rafRef.current = requestAnimationFrame(drawFrameLoop);
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      // wait for real dimensions before sizing the canvas
      await new Promise<void>((resolve) => {
        if (video.videoWidth && video.videoHeight) return resolve();
        video.onloadedmetadata = () => resolve();
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      // start drawing camera frames + watermark onto the visible canvas
      rafRef.current = requestAnimationFrame(drawFrameLoop);

      // record from the watermarked canvas (video) + original mic (audio)
      const canvasStream = (canvas as HTMLCanvasElement).captureStream(30);
      const audioTracks = stream.getAudioTracks();
      const recordStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);

      chunksRef.current = [];
      const recorder = new MediaRecorder(recordStream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        onCaptured(url, blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSecondsLeft(DURATION_SEC);

      // Hard-enforced exact 10 second countdown — auto stop, no early/late stop
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            recorder.stop();
            setRecording(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Camera/mic access denied or unavailable");
    }
  }

  function handleRetake() {
    onRetake?.();
    setSecondsLeft(DURATION_SEC);
  }

  if (captured) {
    return (
      <div className="video-capture-block">
        <div className="camera-preview">
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/media-has-caption */}
          <video src={captured} controls style={{ width: "100%" }} />
        </div>
        <div className="success-pill">✅ {label} recorded (10s)</div>
        <button className="retake-link" onClick={handleRetake}>
          Re-Record
        </button>
      </div>
    );
  }

  return (
    <div className="video-capture-block">
      {error && <div className="error-text">{error}</div>}

      <div className="camera-preview">
        {/* hidden raw camera feed, used only as a frame source for the canvas */}
        <video ref={videoRef} muted playsInline style={{ display: "none" }} />
        {/* visible watermarked preview — this is exactly what gets recorded */}
        <canvas ref={canvasRef} style={{ width: "100%", display: recording ? "block" : "none" }} />
        {!recording && <div className="hint-small">Camera preview will appear once you start recording</div>}
      </div>

      {recording ? (
        <div className="rec-timer">⏺ Recording... {secondsLeft}s</div>
      ) : (
        <button className="btn-red-solid" onClick={startRecording}>
          Record {label} (10s)
        </button>
      )}
    </div>
  );
}
