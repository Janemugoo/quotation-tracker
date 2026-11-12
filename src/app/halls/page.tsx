import { auth } from "@/auth";
import { isSessionAdmin } from "@/lib/authz";
import { HALLS } from "@/lib/halls";
import {
  addMonths,
  daysInMonth,
  firstOfMonth,
  formatDay,
  fromDayNumber,
  isIsoDate,
  mondayOf,
  toDayNumber,
} from "@/lib/hallDates";
import { listHallBookings, listQuotationGroupNames } from "@/lib/queries";
import { todayInNairobi } from "@/lib/tenderDates";
import { TopNav } from "@/components/TopNav";
import { HallsView } from "@/components/HallsView";

type RangeKey = "7" | "14" | "month";

export default async function HallsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string }>;
}) {
  const session = await auth();
  const { range, start: startParam } = await searchParams;

  const today = todayInNairobi();
  const rangeKey: RangeKey = range === "7" || range === "month" ? range : "14";
  const anchorSource = isIsoDate(startParam) ? startParam : today;
  const start = rangeKey === "month" ? firstOfMonth(anchorSource) : mondayOf(anchorSource);
  const length =
    rangeKey === "month" ? daysInMonth(start) : rangeKey === "7" ? 7 : 14;

  const startN = toDayNumber(start);
  const days = Array.from({ length }, (_, i) => fromDayNumber(startN + i));
  const last = days[length - 1];

  const href = (key: RangeKey, from: string) => `/halls?range=${key}&start=${from}`;
  const prevStart =
    rangeKey === "month" ? addMonths(start, -1) : fromDayNumber(startN - length);
  const nextStart =
    rangeKey === "month" ? addMonths(start, 1) : fromDayNumber(startN + length);

  const rangeLabel = `${formatDay(startN, { day: "numeric", month: "short" })} – ${formatDay(
    toDayNumber(last),
    { day: "numeric", month: "short", year: "numeric" }
  )}`;

  const bookings = listHallBookings(days[0], last);
  const todays = listHallBookings(today, today);
  const busyIds = new Set(todays.map((b) => b.hall));
  const freeHalls = HALLS.filter((h) => !busyIds.has(h.id)).map((h) => h.id);
  const inUse = HALLS.filter((h) => busyIds.has(h.id)).map((h) => ({
    hall: h.id,
    group: todays.find((b) => b.hall === h.id)!.group_name,
  }));

  return (
    <div className="min-h-screen">
      <TopNav
        userName={session?.user?.name ?? ""}
        isAdmin={isSessionAdmin(session)}
        active="halls"
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <HallsView
          days={days}
          today={today}
          rangeKey={rangeKey}
          rangeLabel={rangeLabel}
          hrefs={{
            prev: href(rangeKey, prevStart),
            next: href(rangeKey, nextStart),
            today: `/halls?range=${rangeKey}`,
            r7: href("7", mondayOf(start)),
            r14: href("14", mondayOf(start)),
            month: href("month", firstOfMonth(start)),
          }}
          bookings={bookings}
          freeHalls={freeHalls}
          inUse={inUse}
          groupNames={listQuotationGroupNames()}
        />
      </main>
    </div>
  );
}
