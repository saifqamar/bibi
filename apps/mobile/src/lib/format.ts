export function formatDuration(
  seconds: number | string | null | undefined,
): string {
  const total = Math.round(Number(seconds ?? 0));
  const minutes = Math.floor(total / 60);
  if (minutes >= 60) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return `${minutes} min`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  )
    return error.message;
  return "Something went wrong. Please try again.";
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
