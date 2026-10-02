import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getQuotation, listFollowUps } from "@/lib/queries";
import { isSessionAdmin } from "@/lib/authz";
import { TopNav } from "@/components/TopNav";
import { QuotationForm } from "@/components/QuotationForm";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteQuotationDialog } from "@/components/DeleteQuotationDialog";
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
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNav userName={session?.user?.name ?? ""} isAdmin={isSessionAdmin(session)} />
      <main className="w-full lg:w-3/4 max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col flex-1 min-h-0">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-brown shrink-0">
          ← Back to quotations
        </Link>

        <div className="flex items-center justify-between gap-4 mt-2 mb-6 shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-brand-brown">
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
          className="inline-flex items-center gap-2 mb-6 bg-white border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-4 py-2.5 hover:border-brand-brown/40 hover:bg-slate-50 transition-colors shrink-0 self-start"
        >
          Generate quotation letter (PDF)
        </a>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <QuotationForm
              action={updateAction}
              printAction={updateAndPrintAction}
              quotation={quotation}
              submitLabel="Save changes"
              printLabel="Save & print quotation"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Follow-up log
            </h2>

            <form action={followUpAction} className="flex gap-2 mb-5">
              <input
                type="text"
                name="note"
                required
                placeholder="e.g. Called 03/09, procurement to advise"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown"
              />
              <button
                type="submit"
                className="shrink-0 bg-brand-brown text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-brown-dark transition-colors"
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

          <DeleteQuotationDialog deleteAction={deleteAction} groupName={quotation.group_name} />
        </div>
      </main>
    </div>
  );
}
