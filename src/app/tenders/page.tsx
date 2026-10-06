import Link from "next/link";
import { auth } from "@/auth";
import { countTenders, listTendersPage, tenderStatusCounts } from "@/lib/queries";
import { isSessionAdmin } from "@/lib/authz";
import {
  TENDER_STATUS_LABELS,
  TENDER_STATUS_ORDER,
  type TenderStatus,
} from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { TenderStatusBadge } from "@/components/TenderStatusBadge";
import { DeadlineLabel } from "@/components/DeadlineLabel";
import { Pager } from "@/components/Pager";

const PAGE_SIZE = 25;

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "—";
  return `KES ${value.toLocaleString("en-KE")}`;
}

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const status = (params.status as TenderStatus | "ALL") || "ALL";
  const search = params.q || "";

  const filters = { status, search };
  const total = countTenders(filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages
  );
  const tenders = listTendersPage(filters, page, PAGE_SIZE);
  const counts = tenderStatusCounts();
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs: { key: TenderStatus | "ALL"; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: totalCount },
    ...TENDER_STATUS_ORDER.map((s) => ({
      key: s,
      label: TENDER_STATUS_LABELS[s],
      count: counts[s],
    })),
  ];

  const hrefFor = (nextStatus: TenderStatus | "ALL", nextPage = 1) => {
    const qs = new URLSearchParams();
    if (nextStatus !== "ALL") qs.set("status", nextStatus);
    if (search) qs.set("q", search);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const text = qs.toString();
    return text ? `/tenders?${text}` : "/tenders";
  };

  return (
    <div className="min-h-screen">
      <TopNav
        userName={session?.user?.name ?? ""}
        isAdmin={isSessionAdmin(session)}
        active="tenders"
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-brand-brown">Tenders</h1>
            <p className="text-sm text-slate-500">
              Tenders we are watching or bidding on, soonest deadline first.
            </p>
          </div>
          <Link
            href="/tenders/new"
            className="shrink-0 bg-brand-brown text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-brown-dark transition-colors"
          >
            + New tender
          </Link>
        </div>

        <form className="mb-4" action="/tenders">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search title, organisation, reference or contact…"
            className="w-full sm:w-96 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown"
          />
        </form>

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {tabs.map((tab) => {
            const active = tab.key === status;
            return (
              <Link
                key={tab.key}
                href={hrefFor(tab.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  active
                    ? "bg-brand-brown text-white border-brand-brown"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-brown/40"
                }`}
              >
                {tab.label} <span className="opacity-70">({tab.count})</span>
              </Link>
            );
          })}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {tenders.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No tenders found.{" "}
              <Link href="/tenders/new" className="text-brand-green font-medium underline">
                Add the first one
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-medium">Deadline</th>
                    <th className="px-4 py-3 font-medium">Tender</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Est. value</th>
                    <th className="px-4 py-3 font-medium">Our bid</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/tenders/${t.id}`} className="block">
                          <DeadlineLabel deadline={t.submission_deadline} status={t.status} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        <Link href={`/tenders/${t.id}`} className="block">
                          <div className="font-medium text-slate-900 truncate">{t.title}</div>
                          <div className="text-xs text-slate-400 truncate">{t.organisation}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <Link href={`/tenders/${t.id}`} className="block">
                          {t.reference_number || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <Link href={`/tenders/${t.id}`} className="block">
                          {formatMoney(t.estimated_value)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-brand-green-dark font-medium whitespace-nowrap">
                        <Link href={`/tenders/${t.id}`} className="block">
                          {formatMoney(t.bid_value)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/tenders/${t.id}`} className="block">
                          <TenderStatusBadge status={t.status} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        <Link href={`/tenders/${t.id}`} className="block">
                          {t.note_count === 0
                            ? "No notes"
                            : `${t.note_count} note${t.note_count === 1 ? "" : "s"}`}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pager
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          hrefFor={(p) => hrefFor(status, p)}
        />
      </main>
    </div>
  );
}
