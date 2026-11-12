"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  HALLS,
  HALL_STATUS_LABELS,
  hallName,
  type HallBooking,
} from "@/lib/halls";
import {
  dayCount,
  firstOfMonth,
  formatDay,
  formatSpan,
  mondayOf,
  toDayNumber,
  weekday,
} from "@/lib/hallDates";
import {
  confirmHallBookingAction,
  removeHallBookingAction,
} from "@/app/halls/actions";
import { BookingDialog, type BookingPrefill } from "@/components/BookingDialog";

export interface HallsViewProps {
  days: string[];
  today: string;
  rangeKey: "7" | "14" | "month";
  rangeLabel: string;
  hrefs: { prev: string; next: string; today: string; r7: string; r14: string; month: string };
  bookings: HallBooking[];
  freeHalls: string[];
  inUse: { hall: string; group: string }[];
  groupNames: string[];
}

const LABEL_W = 132;

const TENTATIVE_STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(135deg, #fef3c7 0 6px, transparent 6px 11px)",
};

export function HallsView(props: HallsViewProps) {
  const { days, today, rangeKey, rangeLabel, hrefs, bookings, freeHalls, inUse, groupNames } = props;
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<BookingPrefill>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const removeRef = useRef<HTMLDialogElement>(null);

  const n = days.length;
  const minCol = n > 14 ? 34 : 58;
  const cols = `${LABEL_W}px repeat(${n}, minmax(${minCol}px, 1fr))`;
  const rowMin = LABEL_W + n * minCol;
  const firstDay = toDayNumber(days[0]);
  const lastDay = toDayNumber(days[n - 1]);
  const todayN = toDayNumber(today);
  const selected = bookings.find((b) => b.id === selectedId) ?? null;
  const groups = Array.from(new Set(HALLS.map((h) => h.group)));

  function openDialog(pre: BookingPrefill) {
    setPrefill(pre);
    setDialogOpen(true);
  }

  function handleSaved(id: string, start: string) {
    setSelectedId(id);
    setDialogOpen(false);
    // Saved on days outside the current view: move the calendar to them.
    if (start) {
      const s = toDayNumber(start);
      if (s < firstDay || s > lastDay) {
        const anchor = rangeKey === "month" ? firstOfMonth(start) : mondayOf(start);
        router.push(`/halls?range=${rangeKey}&start=${anchor}`);
      }
    }
  }

  const rangeLink = (key: "7" | "14" | "month", label: string, href: string) => (
    <Link
      key={key}
      href={href}
      aria-current={rangeKey === key ? "true" : undefined}
      className={`px-3 py-1.5 text-sm transition-colors ${
        rangeKey === key
          ? "bg-brand-brown-light text-brand-brown font-medium"
          : "text-slate-500 hover:text-brand-brown"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-brand-brown">Hall calendar</h1>
          <p className="text-sm text-slate-500">
            Which hall is taken, and when. Click an empty day to book it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openDialog({ start: today })}
          className="shrink-0 bg-brand-brown text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-brown-dark transition-colors"
        >
          + Book a hall
        </button>
      </div>

      {/* Today strip */}
      <section
        aria-label="Today"
        className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 mb-4 space-y-2.5"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold text-slate-900">
            Today, {formatDay(todayN, { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <span className="text-sm font-semibold text-brand-green-dark">
            {freeHalls.length} of {HALLS.length} halls free
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 w-14">Free</span>
          {freeHalls.length === 0 ? (
            <span className="text-xs text-slate-400">None</span>
          ) : (
            freeHalls.map((id) => (
              <span
                key={id}
                className="rounded-full border border-brand-green bg-brand-green-light px-2.5 py-0.5 text-xs font-medium text-brand-green-dark"
              >
                {hallName(id)}
              </span>
            ))
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 w-14">In use</span>
          {inUse.length === 0 ? (
            <span className="text-xs text-slate-400">None</span>
          ) : (
            inUse.map((u) => (
              <span
                key={u.hall}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
              >
                {hallName(u.hall)} · {u.group}
              </span>
            ))
          )}
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-3">
        <Link
          href={hrefs.prev}
          aria-label="Previous"
          className="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600 hover:border-brand-brown/40"
        >
          ‹
        </Link>
        <Link
          href={hrefs.next}
          aria-label="Next"
          className="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600 hover:border-brand-brown/40"
        >
          ›
        </Link>
        <Link
          href={hrefs.today}
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-brand-brown/40"
        >
          Today
        </Link>
        <span className="text-sm font-semibold text-slate-900 tabular-nums min-w-36">
          {rangeLabel}
        </span>
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          {rangeLink("7", "1 week", hrefs.r7)}
          {rangeLink("14", "2 weeks", hrefs.r14)}
          {rangeLink("month", "Month", hrefs.month)}
        </div>
        <div className="sm:ml-auto flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-5 rounded-sm border-l-4 border-brand-green-dark bg-brand-green-light" />
            Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <i
              className="inline-block h-3 w-5 rounded-sm border border-dashed border-amber-700"
              style={TENTATIVE_STRIPES}
            />
            Tentative hold
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div
        role="table"
        aria-label="Hall bookings by day"
        className="bg-white border border-slate-200 rounded-xl overflow-x-auto"
      >
        <div
          role="row"
          className="grid"
          style={{ gridTemplateColumns: cols, minWidth: rowMin }}
        >
          <div
            role="columnheader"
            className="sticky left-0 z-[5] bg-white border-b border-slate-200 px-3 py-2 text-xs text-slate-500 flex items-end"
            style={{ gridRow: 1, gridColumn: 1 }}
          >
            Hall
          </div>
          {days.map((d, i) => {
            const dn = toDayNumber(d);
            const weekend = weekday(dn) === 0 || weekday(dn) === 6;
            const isToday = dn === todayN;
            return (
              <div
                key={d}
                role="columnheader"
                className={`border-b border-slate-200 py-2 text-center text-[11px] leading-tight text-slate-500 ${
                  weekend ? "bg-slate-100" : "bg-white"
                }`}
                style={{ gridRow: 1, gridColumn: i + 2 }}
              >
                <span className="block">
                  {formatDay(dn, { weekday: n > 14 ? "narrow" : "short" })}
                </span>
                <span
                  className={`block mx-auto text-[15px] font-semibold tabular-nums ${
                    isToday
                      ? "h-7 w-7 leading-7 rounded-full bg-brand-brown text-white"
                      : "text-slate-900"
                  }`}
                >
                  {formatDay(dn, { day: "numeric" })}
                </span>
              </div>
            );
          })}
        </div>

        {groups.map((group) => (
          <div key={group} role="rowgroup">
            <div
              className="bg-brand-brown-light border-b border-slate-200 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-brown"
              style={{ minWidth: rowMin }}
            >
              <span className="sticky left-3.5">{group}</span>
            </div>
            {HALLS.filter((h) => h.group === group).map((hall) => {
              const mine = bookings.filter((b) => b.hall === hall.id);
              return (
                <div
                  key={hall.id}
                  role="row"
                  className="grid"
                  style={{ gridTemplateColumns: cols, minWidth: rowMin }}
                >
                  <div
                    role="rowheader"
                    className="sticky left-0 z-[4] bg-white border-r border-b border-slate-200 px-3 flex items-center text-sm font-medium text-slate-800"
                    style={{ gridRow: 1, gridColumn: 1 }}
                  >
                    {hall.name}
                  </div>

                  {days.map((d, i) => {
                    const dn = toDayNumber(d);
                    const taken = mine.some(
                      (b) => toDayNumber(b.start_date) <= dn && toDayNumber(b.end_date) >= dn
                    );
                    const weekend = weekday(dn) === 0 || weekday(dn) === 6;
                    const base = `h-[54px] border-l border-b border-slate-200 p-0 ${
                      dn === todayN
                        ? "bg-brand-brown-light"
                        : weekend
                          ? "bg-slate-100"
                          : "bg-transparent"
                    }`;
                    return taken ? (
                      <div
                        key={d}
                        role="cell"
                        aria-hidden="true"
                        className={base}
                        style={{ gridRow: 1, gridColumn: i + 2 }}
                      />
                    ) : (
                      <button
                        key={d}
                        type="button"
                        role="cell"
                        aria-label={`Book ${hall.name} on ${formatDay(dn, { weekday: "short", day: "numeric", month: "short" })}`}
                        onClick={() => openDialog({ hall: hall.id, start: d, end: d })}
                        className={`${base} hover:bg-brand-brown-light`}
                        style={{ gridRow: 1, gridColumn: i + 2 }}
                      />
                    );
                  })}

                  {mine.map((b) => {
                    const s = toDayNumber(b.start_date);
                    const e = toDayNumber(b.end_date);
                    if (e < firstDay || s > lastDay) return null;
                    const cs = Math.max(s, firstDay);
                    const ce = Math.min(e, lastDay);
                    const tentative = b.status === "TENTATIVE";
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedId(b.id)}
                        title={`${b.group_name} · ${formatSpan(b.start_date, b.end_date)}${tentative ? " (tentative hold)" : ""}`}
                        className={`z-[2] self-center h-[38px] min-w-0 overflow-hidden px-2.5 text-left flex flex-col justify-center border ${
                          tentative
                            ? "border-dashed border-amber-700 text-amber-800"
                            : "border-transparent border-l-4 border-l-brand-green-dark bg-brand-green-light text-brand-green-dark"
                        } ${s < firstDay ? "rounded-l-none ml-0" : "rounded-l-lg ml-[3px]"} ${
                          e > lastDay ? "rounded-r-none mr-0" : "rounded-r-lg mr-[3px]"
                        } ${selectedId === b.id ? "ring-2 ring-brand-brown" : ""}`}
                        style={{
                          gridRow: 1,
                          gridColumn: `${cs - firstDay + 2} / span ${ce - cs + 1}`,
                          ...(tentative ? TENTATIVE_STRIPES : {}),
                        }}
                      >
                        <b className="block truncate text-[12.5px] font-semibold">{b.group_name}</b>
                        <small className="block truncate text-[11px] opacity-85">
                          {tentative ? "Tentative" : ""}
                          {tentative && b.pax ? " · " : ""}
                          {b.pax ? `${b.pax} pax` : ""}
                        </small>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Empty cells are free. Click a booking to see its details. The same hall can&apos;t
        be booked twice on the same day.
      </p>

      {/* Details of the clicked booking */}
      {selected && (
        <section
          aria-label="Booking details"
          className="mt-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <h2 className="text-base font-semibold text-slate-900">{selected.group_name}</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Hall</dt>
              <dd className="font-medium text-slate-800">{hallName(selected.hall)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Dates</dt>
              <dd className="font-medium text-slate-800">
                {formatSpan(selected.start_date, selected.end_date)} (
                {dayCount(selected.start_date, selected.end_date)}{" "}
                {dayCount(selected.start_date, selected.end_date) === 1 ? "day" : "days"})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Pax</dt>
              <dd className="font-medium text-slate-800">{selected.pax ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    selected.status === "CONFIRMED"
                      ? "bg-brand-green-light text-brand-green-dark"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {HALL_STATUS_LABELS[selected.status]}
                </span>
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-xs text-slate-500">Notes</dt>
              <dd className="text-slate-800 whitespace-pre-wrap">{selected.notes || "None"}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {selected.quotation_id && (
              <Link
                href={`/quotations/${selected.quotation_id}`}
                className="text-sm font-medium text-brand-brown underline"
              >
                Open the quotation →
              </Link>
            )}
            {selected.status === "TENTATIVE" && (
              <form action={confirmHallBookingAction.bind(null, selected.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 hover:border-brand-brown/40"
                >
                  Mark as confirmed
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={() => removeRef.current?.showModal()}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:border-red-300"
            >
              Remove booking
            </button>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="px-2 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </section>
      )}

      <dialog
        ref={removeRef}
        className="fixed inset-0 m-auto rounded-xl border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40 w-[calc(100%-2rem)] max-w-sm h-fit"
      >
        <div className="p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">Remove this booking?</h2>
          <p className="text-sm text-slate-500 mb-5">
            This frees{" "}
            <span className="font-medium text-slate-700">
              {selected ? hallName(selected.hall) : "the hall"}
            </span>{" "}
            on those days again. This can&apos;t be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => removeRef.current?.close()}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Cancel
            </button>
            {selected && (
              <form
                action={removeHallBookingAction.bind(null, selected.id)}
                onSubmit={() => removeRef.current?.close()}
              >
                <button
                  type="submit"
                  className="bg-red-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-red-700 transition-colors"
                >
                  Remove booking
                </button>
              </form>
            )}
          </div>
        </div>
      </dialog>

      <BookingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
        prefill={prefill}
        groupNames={groupNames}
      />
    </>
  );
}
