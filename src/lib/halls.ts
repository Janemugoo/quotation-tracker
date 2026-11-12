// The hotel's halls, in the order they appear on the calendar. Hall ids are
// stored on each booking, so keep an id the same if a hall is ever renamed.
export interface Hall {
  id: string;
  name: string;
  group: string;
}

export const MAIN_HALLS = "Main halls";
export const CONFERENCE_CENTER = "ANN VAUGHAN Conference Center";

export const HALLS: Hall[] = [
  { id: "figtree", name: "Figtree hall", group: MAIN_HALLS },
  { id: "acacia", name: "Acacia hall", group: MAIN_HALLS },
  { id: "sarawing-a", name: "Sarawing A", group: MAIN_HALLS },
  { id: "sarawing-b", name: "Sarawing B", group: MAIN_HALLS },
  { id: "pelican", name: "Pelican hall", group: CONFERENCE_CENTER },
  { id: "giraffe", name: "Giraffe hall", group: CONFERENCE_CENTER },
  { id: "longonot", name: "Longonot hall", group: CONFERENCE_CENTER },
  { id: "hyrax", name: "Hyrax hall", group: CONFERENCE_CENTER },
];

export function hallName(id: string): string {
  return HALLS.find((h) => h.id === id)?.name ?? id;
}

export type HallBookingStatus = "CONFIRMED" | "TENTATIVE";

export const HALL_STATUS_LABELS: Record<HallBookingStatus, string> = {
  CONFIRMED: "Confirmed",
  TENTATIVE: "Tentative hold",
};

export interface HallBooking {
  id: string;
  hall: string;
  group_name: string;
  start_date: string; // YYYY-MM-DD, first day
  end_date: string; // YYYY-MM-DD, last day (inclusive)
  pax: number | null;
  status: HallBookingStatus;
  notes: string | null;
  quotation_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
