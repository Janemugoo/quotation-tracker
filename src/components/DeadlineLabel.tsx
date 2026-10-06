import { TENDER_OPEN_STATUSES, type TenderStatus } from "@/lib/types";
import { daysUntil, formatDeadline } from "@/lib/tenderDates";

// The submission date, plus a coloured hint while the tender still needs
// work: red once the deadline has passed, amber from a week out.
export function DeadlineLabel({
  deadline,
  status,
}: {
  deadline: string | null;
  status: TenderStatus;
}) {
  if (!deadline) return <span className="text-slate-400">No deadline</span>;

  const days = daysUntil(deadline);
  const open = TENDER_OPEN_STATUSES.includes(status);

  let hint: { text: string; className: string } | null = null;
  if (open && days !== null) {
    if (days < 0) {
      hint = {
        text: days === -1 ? "1 day overdue" : `${-days} days overdue`,
        className: "text-red-600",
      };
    } else if (days === 0) {
      hint = { text: "Due today", className: "text-red-600" };
    } else if (days <= 7) {
      hint = {
        text: days === 1 ? "Due tomorrow" : `Due in ${days} days`,
        className: "text-amber-600",
      };
    }
  }

  return (
    <div>
      <div className="text-slate-700">{formatDeadline(deadline)}</div>
      {hint && <div className={`text-xs font-medium ${hint.className}`}>{hint.text}</div>}
    </div>
  );
}
