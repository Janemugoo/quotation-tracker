import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isLiveAdmin } from "@/lib/authz";
import { listQuotations } from "@/lib/queries";
import { csvResponse, toCsv, todayStamp } from "@/lib/csv";
import { STATUS_LABELS } from "@/lib/types";

// Admin-only: every quotation as a spreadsheet-friendly CSV.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isLiveAdmin(session)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const headers = [
    "Date of inquiry",
    "Group / client",
    "Event dates",
    "Pax",
    "Package",
    "Status",
    "Business value (KES)",
    "Travel agent",
    "Contact person",
    "Phone",
    "Email",
    "Follow-ups",
    "Last follow-up",
    "Added by",
    "Created",
  ];
  const rows = listQuotations().map((q) => [
    q.date_of_inquiry,
    q.group_name,
    q.event_dates,
    q.number_of_pax,
    q.package,
    STATUS_LABELS[q.status],
    q.business_value,
    q.travel_agent_name,
    q.contact_person,
    q.phone_number,
    q.email,
    q.follow_up_count,
    q.last_follow_up_at,
    q.created_by_name,
    q.created_at,
  ]);

  return csvResponse(toCsv(headers, rows), `quotations-${todayStamp()}.csv`);
}
