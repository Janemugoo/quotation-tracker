import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getQuotation, listFollowUps } from "@/lib/queries";
import { TopNav } from "@/components/TopNav";
import { QuotationForm } from "@/components/QuotationForm";
import { StatusBadge } from "@/components/StatusBadge";
import {
  addFollowUpAction,
  deleteQuotationAction,
  updateQuotationAction,
  updateAndPrintQuotationAction,
} from "@/app/actions";

function formatDateTime(iso: string) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const quotation = getQuotation(id);
  if (!quotation) notFound();

  const followUps = listFollowUps(id);
  const updateAction = updateQuotationAction.bind(null, id);
  const updateAndPrintAction = updateAndPrintQuotationAction.bind(null, id);
  const deleteAction = deleteQuotationAction.bind(null, id);
  const followUpAction = addFollowUpAction.bind(null, id);

  return (
    <div className="min-h-screen">
      <TopNav userName={session?.user?.name ?? ""} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to quotations
        </Link>

        <div className="flex items-center justify-between gap-4 mt-2 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {quotation.group_name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Added by {quotation.created_by_name} · {formatDateTime(quotation.created_at)}
            </p>
          </div>
          <StatusBadge status={quotation.status} />
        </div>

        <a
          href={`/api/quotations/${quotation.id}/letter`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mb-6 bg-white border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-4 py-2.5 hover:border-slate-400 hover:bg-slate-50 transition-colors"
        >
          Generate quotation letter (PDF)
        </a>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <QuotationForm
            action={updateAction}
            printAction={updateAndPrintAction}
            quotation={quotation}
            submitLabel="Save changes"
            printLabel="Save & print quotation"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Follow-up log
          </h2>

          <form action={followUpAction} className="flex gap-2 mb-5">
            <input
              type="text"
              name="note"
              required
              placeholder="e.g. Called 03/09, procurement to advise"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              className="shrink-0 bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors"
            >
              Add
            </button>
          </form>

          {followUps.length === 0 ? (
            <p className="text-sm text-slate-400">No follow-ups logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {followUps.map((f) => (
                <li key={f.id} className="text-sm border-l-2 border-slate-200 pl-3">
                  <p className="text-slate-800">{f.note}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {f.author_name} · {formatDateTime(f.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-red-600 select-none">
            Delete this quotation
          </summary>
          <form action={deleteAction} className="mt-3">
            <p className="text-slate-500 mb-2 text-xs">
              This permanently removes the quotation and its follow-up log.
            </p>
            <button
              type="submit"
              className="bg-red-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-red-700 transition-colors"
            >
              Confirm delete
            </button>
          </form>
        </details>
      </main>
    </div>
  );
}
