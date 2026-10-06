import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isLiveAdmin } from "@/lib/authz";
import { listTenders } from "@/lib/queries";
import { csvResponse, toCsv, todayStamp } from "@/lib/csv";
import { TENDER_STATUS_LABELS } from "@/lib/types";

// Admin-only: every tender as a spreadsheet-friendly CSV.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isLiveAdmin(session)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const headers = [
    "Title",
    "Issued by",
    "Reference no.",
    "Submission deadline",
    "Estimated value (KES)",
    "Our bid (KES)",
    "Status",
    "Contact person",
    "Phone",
    "Email",
    "Notes",
    "Last note",
    "Added by",
    "Created",
  ];
  const rows = listTenders().map((t) => [
    t.title,
    t.organisation,
    t.reference_number,
    t.submission_deadline,
    t.estimated_value,
    t.bid_value,
    TENDER_STATUS_LABELS[t.status],
    t.contact_person,
    t.contact_phone,
    t.contact_email,
    t.note_count,
    t.last_note_at,
    t.created_by_name,
    t.created_at,
  ]);

  return csvResponse(toCsv(headers, rows), `tenders-${todayStamp()}.csv`);
}
