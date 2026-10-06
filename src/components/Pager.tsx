import Link from "next/link";

// Previous / Next controls under a list. `hrefFor` builds the link for a
// given page number so each list keeps its own filters and search in the URL.
export function Pager({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const linkClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-brown/40 hover:bg-slate-50 transition-colors";
  const disabledClass =
    "rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-300 cursor-not-allowed";

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 mt-4 text-sm text-slate-500"
    >
      <p>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClass}>
            ← Previous
          </Link>
        ) : (
          <span className={disabledClass}>← Previous</span>
        )}
        <span className="hidden sm:inline text-xs text-slate-400">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className={linkClass}>
            Next →
          </Link>
        ) : (
          <span className={disabledClass}>Next →</span>
        )}
      </div>
    </nav>
  );
}
