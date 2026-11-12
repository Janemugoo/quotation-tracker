"use client";

import Link from "next/link";
import { useState } from "react";
import { HALL_STATUS_LABELS, hallName, type HallBooking } from "@/lib/halls";
import { formatSpan, mondayOf } from "@/lib/hallDates";
import { BookingDialog, type BookingPrefill } from "@/components/BookingDialog";

// The "Hall booking" card on a quotation: shows the halls already booked for
// it and a button that opens the booking form with the group, dates and pax
// filled in. A Confirmed quotation offers a confirmed booking; any other
// status (TBC) offers a tentative hold.
export function QuotationHallCard({
  quotationId,
  groupName,
  eventFrom,
  eventTo,
  pax,
  confirmed,
  bookings,
  groupNames,
}: {
  quotationId: string;
  groupName: string;
  eventFrom: string | null;
  eventTo: string | null;
  pax: number | null;
  confirmed: boolean;
  bookings: HallBooking[];
  groupNames: string[];
}) {
  const [open, setOpen] = useState(false);

  const prefill: BookingPrefill = {
    start: eventFrom || "",
    end: eventTo || eventFrom || "",
    group: groupName,
    pax,
    status: confirmed ? "CONFIRMED" : "TENTATIVE",
    quotationId,
  };
  const hasDates = !!eventFrom;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-1">Hall booking</h2>
      <p className="text-sm text-slate-500 mb-4">
        {confirmed
          ? "This quotation is confirmed, so the hall can be booked."
          : "Hold a hall tentatively while the client decides. Confirm it on the hall calendar once they do."}
      </p>

      {bookings.length > 0 && (
        <ul className="space-y-2 mb-4">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm border-l-2 border-brand-green pl-3"
            >
              <span className="font-medium text-slate-800">{hallName(b.hall)}</span>
              <span className="text-slate-600">{formatSpan(b.start_date, b.end_date)}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  b.status === "CONFIRMED"
                    ? "bg-brand-green-light text-brand-green-dark"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {HALL_STATUS_LABELS[b.status]}
              </span>
              <Link
                href={`/halls?range=14&start=${mondayOf(b.start_date)}`}
                className="text-brand-brown underline text-xs font-medium"
              >
                View on the calendar
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand-brown text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-brown-dark transition-colors"
      >
        {bookings.length > 0
          ? "Book another hall"
          : hasDates
            ? "Book a hall for these dates"
            : "Book a hall"}
      </button>
      {!hasDates && (
        <p className="text-xs text-slate-400 mt-2">
          This quotation has no event dates yet, so you&apos;ll pick the days in the form.
        </p>
      )}

      <BookingDialog
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => setOpen(false)}
        prefill={prefill}
        groupNames={groupNames}
      />
    </div>
  );
}
