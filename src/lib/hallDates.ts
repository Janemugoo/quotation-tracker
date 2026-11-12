// Calendar-day maths for the hall calendar. Days are plain YYYY-MM-DD strings
// (no times), converted to whole-day numbers in UTC so month lengths and
// daylight saving never shift a booking by a day.
const DAY = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s: string | null | undefined): s is string {
  if (!s || !ISO.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function toDayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
}

export function fromDayNumber(n: number): string {
  return new Date(n * DAY).toISOString().slice(0, 10);
}

// 0 = Sunday … 6 = Saturday
export function weekday(n: number): number {
  return new Date(n * DAY).getUTCDay();
}

export function mondayOf(iso: string): string {
  const n = toDayNumber(iso);
  return fromDayNumber(n - ((weekday(n) + 6) % 7));
}

export function firstOfMonth(iso: string): string {
  return `${iso.slice(0, 8)}01`;
}

export function daysInMonth(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addMonths(iso: string, delta: number): string {
  const [y, m] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  return dt.toISOString().slice(0, 10);
}

export function formatDay(
  n: number,
  opts: Intl.DateTimeFormatOptions
): string {
  return new Date(n * DAY).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}

// "13 Nov" for one day, "10 – 13 Nov" or "28 Oct – 2 Nov" for several.
export function formatSpan(startIso: string, endIso: string): string {
  const a = toDayNumber(startIso);
  const b = toDayNumber(endIso);
  if (a === b) return formatDay(a, { day: "numeric", month: "short" });
  const sameMonth = startIso.slice(0, 7) === endIso.slice(0, 7);
  return sameMonth
    ? `${formatDay(a, { day: "numeric" })} – ${formatDay(b, { day: "numeric", month: "short" })}`
    : `${formatDay(a, { day: "numeric", month: "short" })} – ${formatDay(b, { day: "numeric", month: "short" })}`;
}

export function dayCount(startIso: string, endIso: string): number {
  return toDayNumber(endIso) - toDayNumber(startIso) + 1;
}
