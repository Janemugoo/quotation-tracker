export type QuotationStatus =
  | "INQUIRY"
  | "FOLLOWED_UP"
  | "TBC"
  | "CONFIRMED"
  | "DECLINED"
  | "LOST";

export const STATUS_LABELS: Record<QuotationStatus, string> = {
  INQUIRY: "Inquiry",
  FOLLOWED_UP: "Followed up",
  TBC: "TBC",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  LOST: "Lost",
};

export const STATUS_ORDER: QuotationStatus[] = [
  "INQUIRY",
  "FOLLOWED_UP",
  "TBC",
  "CONFIRMED",
  "DECLINED",
  "LOST",
];

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  is_admin: number; // SQLite stores booleans as 0/1
  created_at: string;
}

// A single rate line for quotations that have more than one — e.g.
// different room types, or the same room at a different nightly rate for
// part of the stay. When a quotation has these, the letter renders one
// table row per line item (rate x pax x nights) plus a grand total, instead
// of the single package/rate/provisions/business_value row below.
export interface QuotationLineItem {
  package: string;
  provisions: string;
  rate: number;
  pax: number;
  nights: number;
}

export interface Quotation {
  id: string;
  date_of_inquiry: string;
  group_name: string;
  event_dates: string | null;
  event_date_from: string | null;
  event_date_to: string | null;
  number_of_pax: string | null;
  package: string | null;
  rate: string | null;
  provisions: string | null;
  line_items: QuotationLineItem[] | null;
  travel_agent_name: string | null;
  contact_person: string | null;
  phone_number: string | null;
  email: string | null;
  status: QuotationStatus;
  business_value: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationWithMeta extends Quotation {
  created_by_name: string;
  follow_up_count: number;
  last_follow_up_at: string | null;
}

export interface FollowUp {
  id: string;
  quotation_id: string;
  author_id: string;
  note: string;
  created_at: string;
}

export interface FollowUpWithAuthor extends FollowUp {
  author_name: string;
}

// ---------- Tenders ----------

export type TenderStatus =
  | "FOUND"
  | "PREPARING"
  | "SUBMITTED"
  | "WON"
  | "LOST"
  | "NOT_BIDDING";

export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
  FOUND: "Found",
  PREPARING: "Preparing",
  SUBMITTED: "Submitted",
  WON: "Won",
  LOST: "Lost",
  NOT_BIDDING: "Not bidding",
};

export const TENDER_STATUS_ORDER: TenderStatus[] = [
  "FOUND",
  "PREPARING",
  "SUBMITTED",
  "WON",
  "LOST",
  "NOT_BIDDING",
];

// Tenders still needing work before the deadline — only these get the
// "closing soon" / "overdue" flags on the list.
export const TENDER_OPEN_STATUSES: TenderStatus[] = ["FOUND", "PREPARING"];

export interface Tender {
  id: string;
  title: string;
  organisation: string;
  reference_number: string | null;
  submission_deadline: string | null; // YYYY-MM-DD
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: TenderStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TenderWithMeta extends Tender {
  created_by_name: string;
  note_count: number;
  last_note_at: string | null;
}

export interface TenderNote {
  id: string;
  tender_id: string;
  author_id: string;
  note: string;
  created_at: string;
}

export interface TenderNoteWithAuthor extends TenderNote {
  author_name: string;
}
