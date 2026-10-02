import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQuotation } from "@/lib/queries";
import { generateQuotationLetterPdf } from "@/lib/pdf/quotationLetter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const quotation = getQuotation(id);
  if (!quotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBytes = await generateQuotationLetterPdf(
    quotation,
    session.user.name ?? "Reservations Desk"
  );

  const filename = `Quotation - ${quotation.group_name}.pdf`.replace(
    /[/\\?%*:|"<>]/g,
    "-"
  );

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
