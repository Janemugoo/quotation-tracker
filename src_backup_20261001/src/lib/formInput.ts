import type { QuotationLineItem, QuotationStatus } from "@/lib/types";
import type { QuotationInput } from "@/lib/queries";

// Strips everything except digits and a decimal point, then parses — so
// "7,000", "KSH 7000", or a bare "7000" all read the same, and free-text
// left over from before rate/pax were numeric fields (e.g. "3,800 per pax")
// still degrades to a usable number instead of breaking the calculation.
export function toNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Reads the repeated line-item inputs (same `name` on every row, rendered
// by <LineItemsEditor>) back into an array. Rows missing any of the
// required values are dropped — an empty "Add rate line" row the person
// never filled in shouldn't end up in the saved quotation. Package is
// per-row and optional (it's there to note the room config — twin, single,
// etc. — on that line, separate from the quotation's overall Package used
// in the letter's heading), so a blank one doesn't drop the row.
export function parseLineItems(formData: FormData): QuotationLineItem[] | null {
  const packages = formData.getAll("line_item_package") as string[];
  const provisions = formData.getAll("line_item_provisions") as string[];
  const rates = formData.getAll("line_item_rate") as string[];
  const paxes = formData.getAll("line_item_pax") as string[];
  const nights = formData.getAll("line_item_nights") as string[];

  const items: QuotationLineItem[] = [];
  for (let i = 0; i < provisions.length; i++) {
    const p = provisions[i]?.trim();
    const pkg = packages[i]?.trim() ?? "";
    const rate = toNumber(rates[i]);
    const pax = toNumber(paxes[i]);
    const nightsVal = toNumber(nights[i]);
    if (!p || rate === null || pax === null || nightsVal === null) {
      continue;
    }
    items.push({ package: pkg, provisions: p, rate, pax, nights: nightsVal });
  }
  return items.length > 0 ? items : null;
}

// Formats the two date-picker values into the human-readable range the
// letter title and dashboard show — "3 - 6 Oct 2026" when both dates share
// a month and year, "28 Sep - 3 Oct 2026" otherwise. Falls back gracefully
// if only one side was filled in.
export function formatEventDateRange(
  from: string | null | undefined,
  to: string | null | undefined
): string {
  const parse = (s: string | null | undefined) => {
    if (!s) return null;
    const d = new Date(`${s}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const fromDate = parse(from);
  const toDate = parse(to);

  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-GB", opts);

  if (fromDate && toDate) {
    const sameMonthYear =
      fromDate.getMonth() === toDate.getMonth() &&
      fromDate.getFullYear() === toDate.getFullYear();
    if (sameMonthYear) {
      return `${fromDate.getDate()} - ${fmt(toDate, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return `${fmt(fromDate, { day: "numeric", month: "short" })} - ${fmt(toDate, { day: "numeric", month: "short", year: "numeric" })}`;
  }
  if (fromDate) return fmt(fromDate, { day: "numeric", month: "short", year: "numeric" });
  if (toDate) return fmt(toDate, { day: "numeric", month: "short", year: "numeric" });
  return "";
}

// Parses the whole quotation form (used by both the create/update server
// actions and the no-save "preview letter" route, so the two stay in sync).
export function parseQuotationFormInput(formData: FormData): QuotationInput {
  const line_items = parseLineItems(formData);

  // The business value is never typed in directly — it's the sum of the
  // Rate Breakdown rows' totals (rate x pax x nights per row). Likewise the
  // pax count shown on the dashboard is the sum of each row's pax, so it
  // stays meaningful even though there's no separate "no. of pax" field.
  const business_value = line_items
    ? line_items.reduce((sum, item) => sum + item.rate * item.pax * item.nights, 0)
    : null;
  const totalPax = line_items
    ? line_items.reduce((sum, item) => sum + item.pax, 0)
    : null;

  const event_date_from = (formData.get("event_date_from") as string)?.trim() || "";
  const event_date_to = (formData.get("event_date_to") as string)?.trim() || "";
  const event_dates = formatEventDateRange(event_date_from, event_date_to);

  return {
    date_of_inquiry: formData.get("date_of_inquiry") as string,
    group_name: (formData.get("group_name") as string)?.trim(),
    event_dates,
    event_date_from,
    event_date_to,
    number_of_pax: totalPax !== null ? String(totalPax) : "",
    package: (formData.get("package") as string)?.trim(),
    rate: "",
    provisions: "",
    travel_agent_name: (formData.get("travel_agent_name") as string)?.trim(),
    contact_person: (formData.get("contact_person") as string)?.trim(),
    phone_number: (formData.get("phone_number") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    status: (formData.get("status") as QuotationStatus) ?? "INQUIRY",
    business_value,
    line_items,
  };
}
