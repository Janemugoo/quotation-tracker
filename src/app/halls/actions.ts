"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HALLS, hallName, type HallBookingStatus } from "@/lib/halls";
import { dayCount, formatSpan, isIsoDate, toDayNumber } from "@/lib/hallDates";
import {
  createHallBooking,
  deleteHallBooking,
  findHallClash,
  getHallBooking,
  quotationExists,
  setHallBookingStatus,
} from "@/lib/queries";

export interface BookingFormState {
  error?: string;
  // Changes after every successful save so the form knows to close.
  savedId?: string;
  // First day of the saved booking, so the calendar can scroll to it.
  savedStart?: string;
  // What was typed, sent back with an error so the form keeps it (React
  // clears a form after its action runs).
  values?: Record<string, string>;
  // New on every error, so the form can rebuild its fields with `values`.
  nonce?: string;
}

const MAX_DAYS = 120;

export async function createHallBookingAction(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const text = (name: string) => (formData.get(name) as string | null)?.trim() ?? "";
  const hall = text("hall");
  const start = text("start_date");
  const end = text("end_date");
  const group = text("group_name");
  const notes = text("notes");
  const status: HallBookingStatus = text("status") === "TENTATIVE" ? "TENTATIVE" : "CONFIRMED";
  const paxRaw = text("pax");
  const quotationId = text("quotation_id");
  const values = {
    hall,
    start_date: start,
    end_date: end,
    group_name: group,
    pax: paxRaw,
    status,
    notes,
  };
  const fail = (error: string): BookingFormState => ({
    error,
    values,
    nonce: Math.random().toString(36).slice(2),
  });

  if (!HALLS.some((h) => h.id === hall)) return fail("Choose which hall to book.");
  if (!isIsoDate(start) || !isIsoDate(end)) return fail("Enter the first and last day.");
  if (toDayNumber(end) < toDayNumber(start)) {
    return fail("The last day can't be before the first day.");
  }
  if (dayCount(start, end) > MAX_DAYS) {
    return fail(`A booking can cover at most ${MAX_DAYS} days. Split it into two bookings.`);
  }
  if (!group) return fail("Enter the group or client name.");
  if (group.length > 120) return fail("The group name is too long (120 characters at most).");
  if (notes.length > 500) return fail("Notes are too long (500 characters at most).");

  let pax: number | null = null;
  if (paxRaw) {
    const n = Number(paxRaw);
    if (!Number.isInteger(n) || n < 0 || n > 100000) {
      return fail("Number of pax must be a whole number.");
    }
    pax = n;
  }

  const clash = findHallClash(hall, start, end);
  if (clash) {
    return fail(
      `${hallName(hall)} is already booked ${formatSpan(clash.start_date, clash.end_date)} for ${clash.group_name}. Pick other days or another hall.`
    );
  }

  const linked = quotationId && quotationExists(quotationId) ? quotationId : null;
  const booking = createHallBooking(
    {
      hall,
      group_name: group,
      start_date: start,
      end_date: end,
      pax,
      status,
      notes,
      quotation_id: linked,
    },
    (session.user as { id: string }).id
  );

  revalidatePath("/halls");
  if (linked) revalidatePath(`/quotations/${linked}`);
  return { savedId: booking.id, savedStart: booking.start_date };
}

export async function confirmHallBookingAction(id: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const booking = getHallBooking(id);
  if (!booking) return;
  setHallBookingStatus(id, "CONFIRMED");
  revalidatePath("/halls");
  if (booking.quotation_id) revalidatePath(`/quotations/${booking.quotation_id}`);
}

export async function removeHallBookingAction(id: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const booking = getHallBooking(id);
  if (!booking) return;
  deleteHallBooking(id);
  revalidatePath("/halls");
  if (booking.quotation_id) revalidatePath(`/quotations/${booking.quotation_id}`);
}
