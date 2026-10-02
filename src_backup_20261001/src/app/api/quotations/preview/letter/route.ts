import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseQuotationFormInput } from "@/lib/formInput";
import { generateQuotationLetterPdf } from "@/lib/pdf/quotationLetter";
import type { QuotationWithMeta } from "@/lib/types";

// Renders the letter straight from whatever is currently in the form —
// nothing is saved. This is the "see an overview before generating the
// final quote" preview: the form's own "Preview letter" button submits
// here (formAction + formTarget="_blank") as an ordinary browser form
// POST, so no client-side JS is needed to wire it up.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const input = parseQuotationFormInput(formData);

  if (!input.group_name) {
    return NextResponse.json(
      { error: "Fill in the group / client name before previewing." },
      { status: 400 }
    );
  }

  // A stand-in quotation — same shape the real letter generator expects,
  // but never written to the database.
  const now = new Date().toISOString();
  const previewQuotation: QuotationWithMeta = {
    id: "preview",
    ...input,
    created_by: "preview",
    created_at: now,
    updated_at: now,
    created_by_name: session.user.name ?? "Reservations Desk",
    follow_up_count: 0,
    last_follow_up_at: null,
  };

  const pdfBytes = await generateQuotationLetterPdf(
    previewQuotation,
    session.user.name ?? "Reservations Desk"
  );

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quotation-preview.pdf"`,
    },
  });
}
