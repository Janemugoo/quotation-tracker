import { TENDER_STATUS_LABELS, type TenderStatus } from "@/lib/types";

const COLORS: Record<TenderStatus, string> = {
  FOUND: "bg-amber-50 text-amber-700 border-amber-200",
  PREPARING: "bg-blue-50 text-blue-700 border-blue-200",
  SUBMITTED: "bg-violet-50 text-violet-700 border-violet-200",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-red-50 text-red-700 border-red-200",
  NOT_BIDDING: "bg-slate-100 text-slate-500 border-slate-200",
};

export function TenderStatusBadge({ status }: { status: TenderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${COLORS[status]}`}
    >
      {TENDER_STATUS_LABELS[status]}
    </span>
  );
}
