"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  addFollowUp,
  createQuotation,
  deleteQuotation,
  updateQuotation,
} from "@/lib/queries";
import { parseQuotationFormInput as parseInput } from "@/lib/formInput";

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
