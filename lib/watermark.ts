// Shared helper to burn a geotag-style watermark (location, date, time, lat/long)
// onto an image or a video frame drawn on a <canvas>.

export type GpsCoords = { lat: number; lng: number; accuracy: number };

// Best-effort reverse geocode (lat/lng -> human readable address).
// Never throws — falls back to null so the caller can just use lat/lng.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name || null;
  } catch {
    return null;
  }
}

// Builds the exact text lines to stamp on the media (address, lat/long, date & time).
export function buildWatermarkLines(gps: GpsCoords | null, address?: string | null): string[] {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const lines: string[] = [];
  if (address) lines.push(address);
  if (gps) {
    lines.push(
      `Lat: ${gps.lat.toFixed(6)}  Long: ${gps.lng.toFixed(6)} (±${Math.round(gps.accuracy)}m)`
    );
  }
  lines.push(`${dateStr}  ${timeStr}`);
  return lines;
}

// Draws a semi-transparent bar + the given text lines at the bottom of the canvas.
export function drawWatermarkOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lines: string[]
) {
  if (!lines || lines.length === 0) return;

  const fontSize = Math.max(12, Math.round(width * 0.026));
  const lineHeight = Math.round(fontSize * 1.4);
  const padding = Math.round(fontSize * 0.6);
  const boxHeight = lines.length * lineHeight + padding * 2;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, height - boxHeight, width, boxHeight);

  ctx.font = `${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.fillText(
      line,
      padding,
      height - boxHeight + padding + i * lineHeight,
      width - padding * 2
    );
  });
  ctx.restore();
}
