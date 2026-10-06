"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  addTenderNote,
  createTender,
  deleteTender,
  updateTender,
} from "@/lib/queries";
import { parseTenderFormInput } from "@/lib/formInput";

export async function createTenderAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const input = parseTenderFormInput(formData);
  if (!input.title || !input.organisation) {
    throw new Error("Tender title and the issuing organisation are required.");
  }

  const tender = createTender(input, (session.user as { id: string }).id);
  revalidatePath("/tenders");
  redirect(`/tenders/${tender.id}`);
}

export async function updateTenderAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const input = parseTenderFormInput(formData);
  if (!input.title || !input.organisation) {
    throw new Error("Tender title and the issuing organisation are required.");
  }

  updateTender(id, input);
  revalidatePath("/tenders");
  revalidatePath(`/tenders/${id}`);
  redirect(`/tenders/${id}`);
}

export async function deleteTenderAction(id: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  deleteTender(id);
  revalidatePath("/tenders");
  redirect("/tenders");
}

export async function addTenderNoteAction(tenderId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const note = (formData.get("note") as string)?.trim();
  if (!note) return;

  addTenderNote({
    tenderId,
    authorId: (session.user as { id: string }).id,
    note,
  });
  revalidatePath(`/tenders/${tenderId}`);
  revalidatePath("/tenders");
}
