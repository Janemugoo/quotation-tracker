// Deadlines are plain calendar dates (YYYY-MM-DD) with no time, so "today"
// has to be the hotel's today (Nairobi), not the server's — the hosting
// machine runs on UTC and would flip to tomorrow three hours early.
export function todayInNairobi(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
}

// Whole days from today until the deadline: negative once it has passed,
// 0 on the day itself. Null when there is no usable date.
export function daysUntil(deadline: string | null | undefined): number | null {
  if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
  const [y, m, d] = deadline.split("-").map(Number);
  const [ty, tm, td] = todayInNairobi().split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td);
  return Math.round(ms / 86_400_000);
}

export function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "—";
  const d = new Date(`${deadline}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return deadline;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
