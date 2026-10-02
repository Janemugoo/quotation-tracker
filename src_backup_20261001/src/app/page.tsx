import Link from "next/link";
import { auth } from "@/auth";
import { listQuotations, statusCounts } from "@/lib/queries";
import { STATUS_LABELS, STATUS_ORDER, type QuotationStatus } from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { StatusBadge } from "@/components/StatusBadge";

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "—";
  return `KES ${value.toLocaleString("en-KE")}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const status = (params.status as QuotationStatus | "ALL") || "ALL";
  const search = params.q || "";

  const quotations = listQuotations({ status, search });
  const counts = statusCounts();
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs: { key: QuotationStatus | "ALL"; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: totalCount },
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_LABELS[s], count: counts[s] })),
  ];

  return (
    <div className="min-h-screen">
      <TopNav userName={session?.user?.name ?? ""} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Quotations</h1>
            <p className="text-sm text-slate-500">
              All requested quotations and their follow-up status.
            </p>
          </div>
          <Link
            href="/quotations/new"
            className="shrink-0 bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors"
          >
            + New quotation
          </Link>
        </div>

        <form className="mb-4" action="/">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search group, agent, contact or email…"
            className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </form>

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {tabs.map((tab) => {
            const href =
              tab.key === "ALL"
                ? search
                  ? `/?q=${encodeURIComponent(search)}`
                  : "/"
                : `/?status=${tab.key}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
            const active = tab.key === status;
            return (
              <Link
                key={tab.key}
                href={href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {tab.label} <span className="opacity-70">({tab.count})</span>
              </Link>
            );
          })}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {quotations.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No quotations found.{" "}
              <Link href="/quotations/new" className="text-slate-900 underline">
                Add the first one
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">Inquiry date</th>
                    <th className="px-4 py-3 font-medium">Group</th>
                    <th className="px-4 py-3 font-medium">Event dates</th>
                    <th className="px-4 py-3 font-medium">Pax</th>
                    <th className="px-4 py-3 font-medium">Package</th>
                    <th className="px-4 py-3 font-medium">Business value</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr
                      key={q.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/quotations/${q.id}`} className="block">
                          {formatDate(q.date_of_inquiry)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <Link href={`/quotations/${q.id}`} className="block">
                          <div className="font-medium text-slate-900 truncate">
                            {q.group_name}
                          </div>
                          {q.travel_agent_name && (
                            <div className="text-xs text-slate-400 truncate">
                              {q.travel_agent_name}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <Link href={`/quotations/${q.id}`} className="block">
                          {q.event_dates || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <Link href={`/quotations/${q.id}`} className="block">
                          {q.number_of_pax || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">
                        <Link href={`/quotations/${q.id}`} className="block truncate">
                          {q.package || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <Link href={`/quotations/${q.id}`} className="block">
                          {formatMoney(q.business_value)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/quotations/${q.id}`} className="block">
                          <StatusBadge status={q.status} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        <Link href={`/quotations/${q.id}`} className="block">
                          {q.last_follow_up_at
                            ? formatDate(q.last_follow_up_at)
                            : q.follow_up_count === 0
                              ? "Not followed up"
                              : "—"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
