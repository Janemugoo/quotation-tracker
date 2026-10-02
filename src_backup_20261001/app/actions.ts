"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  addFollowUp,
  createQuotation,
  deleteQuotation,
  updateQuotation,
  type QuotationInput,
} from "@/lib/queries";
import type { QuotationLineItem, QuotationStatus } from "@/lib/types";

// Reads the repeated line-item inputs (same `name` on every row, rendered
// by <LineItemsEditor>) back into an array. Rows missing any of the four
// values are dropped — an empty "Add rate line" row the person never filled
// in shouldn't end up in the saved quotation.
function parseLineItems(formData: FormData): QuotationLineItem[] | null {
  const provisions = formData.getAll("line_item_provisions") as string[];
  const rates = formData.getAll("line_item_rate") as string[];
  const paxes = formData.getAll("line_item_pax") as string[];
  const nights = formData.getAll("line_item_nights") as string[];

  const items: QuotationLineItem[] = [];
  for (let i = 0; i < provisions.length; i++) {
    const p = provisions[i]?.trim();
    const rate = parseFloat(rates[i]);
    const pax = parseInt(paxes[i], 10);
    const nightsVal = parseInt(nights[i], 10);
    if (!p || !Number.isFinite(rate) || !Number.isFinite(pax) || !Number.isFinite(nightsVal)) {
      continue;
    }
    items.push({ provisions: p, rate, pax, nights: nightsVal });
  }
  return items.length > 0 ? items : null;
}

function parseInput(formData: FormData): QuotationInput {
  const businessValueRaw = (formData.get("business_value") as string) ?? "";
  const cleaned = businessValueRaw.replace(/[^0-9.]/g, "");
  const line_items = parseLineItems(formData);

  // When the quotation has multiple rate lines, the grand total is always
  // the sum of those lines — not the manually-typed business value field,
  // which stays for the ordinary single-rate case.
  const business_value = line_items
    ? line_items.reduce((sum, item) => sum + item.rate * item.pax * item.nights, 0)
    : cleaned
      ? parseFloat(cleaned)
      : null;

  return {
    date_of_inquiry: formData.get("date_of_inquiry") as string,
    group_name: (formData.get("group_name") as string)?.trim(),
    event_dates: (formData.get("event_dates") as string)?.trim(),
    number_of_pax: (formData.get("number_of_pax") as string)?.trim(),
    package: (formData.get("package") as string)?.trim(),
    rate: (formData.get("rate") as string)?.trim(),
    provisions: (formData.get("provisions") as string)?.trim(),
    travel_agent_name: (formData.get("travel_agent_name") as string)?.trim(),
    contact_person: (formData.get("contact_person") as string)?.trim(),
    phone_number: (formData.get("phone_number") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    status: (formData.get("status") as QuotationStatus) ?? "INQUIRY",
    business_value,
    line_items,
  };
}

export async function createQuotationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const input = parseInput(formData);
  if (!input.group_name || !input.date_of_inquiry) {
    throw new Error("Group name and date of inquiry are required.");
  }

  const quotation = createQuotation(
    input,
    (session.user as { id: string }).id
  );
  revalidatePath("/");
  redirect(`/quotations/${quotation.id}`);
}

// Same as createQuotationAction, but sends the user straight to the
// generated quotation letter (PDF) instead of the quotation's detail page —
// the "fill out the quote and print it" flow.
export async function createAndPrintQuotationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const input = parseInput(formData);
  if (!input.group_name || !input.date_of_inquiry) {
    throw new Error("Group name and date of inquiry are required.");
  }

  const quotation = createQuotation(
    input,
    (session.user as { id: string }).id
  );
  revalidatePath("/");
  redirect(`/api/quotations/${quotation.id}/letter`);
}

export async function updateQuotationAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const input = parseInput(formData);
  if (!input.group_name || !input.date_of_inquiry) {
    throw new Error("Group name and date of inquiry are required.");
  }

  updateQuotation(id, input);
  revalidatePath("/");
  revalidatePath(`/quotations/${id}`);
  redirect(`/quotations/${id}`);
}

// Same as updateQuotationAction, but sends the user straight to the
// generated quotation letter (PDF) after saving the changes.
export async function updateAndPrintQuotationAction(
  id: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const input = parseInput(formData);
  if (!input.group_name || !input.date_of_inquiry) {
    throw new Error("Group name and date of inquiry are required.");
  }

  updateQuotation(id, input);
  revalidatePath("/");
  revalidatePath(`/quotations/${id}`);
  redirect(`/api/quotations/${id}/letter`);
}

export async function deleteQuotationAction(id: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  deleteQuotation(id);
  revalidatePath("/");
  redirect("/");
}

export async function addFollowUpAction(quotationId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const note = (formData.get("note") as string)?.trim();
  if (!note) return;

  addFollowUp({
    quotationId,
    authorId: (session.user as { id: string }).id,
    note,
  });
  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath("/");
}
