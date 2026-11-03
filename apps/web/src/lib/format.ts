export function formatDuration(
  seconds: number | string | null | undefined,
): string {
  const minutes = Math.round(Number(seconds ?? 0) / 60);
  if (minutes >= 60) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return `${Math.max(1, minutes)} min`;
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(count);
}

export function isoDuration(
  seconds: number | string | null | undefined,
): string {
  return `PT${Math.round(Number(seconds ?? 0))}S`;
}
