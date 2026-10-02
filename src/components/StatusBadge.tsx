import { STATUS_LABELS, type QuotationStatus } from "@/lib/types";

const COLORS: Record<QuotationStatus, string> = {
  INQUIRY: "bg-amber-50 text-amber-700 border-amber-200",
  FOLLOWED_UP: "bg-blue-50 text-blue-700 border-blue-200",
  TBC: "bg-violet-50 text-violet-700 border-violet-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-slate-100 text-slate-500 border-slate-200",
  LOST: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
