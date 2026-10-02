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
  created_at: string;
}

// A single rate line for quotations that have more than one — e.g.
// different room types, or the same room at a different nightly rate for
// part of the stay. When a quotation has these, the letter renders one
// table row per line item (rate x pax x nights) plus a grand total, instead
// of the single package/rate/provisions/business_value row below.
export interface QuotationLineItem {
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
