import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getTender, listTenderNotes } from "@/lib/queries";
import { isSessionAdmin } from "@/lib/authz";
import { TopNav } from "@/components/TopNav";
import { TenderForm } from "@/components/TenderForm";
import { TenderStatusBadge } from "@/components/TenderStatusBadge";
import { DeadlineLabel } from "@/components/DeadlineLabel";
import { DeleteTenderDialog } from "@/components/DeleteTenderDialog";
import {
  addTenderNoteAction,
  deleteTenderAction,
  updateTenderAction,
} from "@/app/tenders/actions";

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

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const tender = getTender(id);
  if (!tender) notFound();

  const notes = listTenderNotes(id);
  const updateAction = updateTenderAction.bind(null, id);
  const deleteAction = deleteTenderAction.bind(null, id);
  const noteAction = addTenderNoteAction.bind(null, id);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNav
        userName={session?.user?.name ?? ""}
        isAdmin={isSessionAdmin(session)}
        active="tenders"
      />
      <main className="w-full lg:w-3/4 max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col flex-1 min-h-0">
        <Link href="/tenders" className="text-sm text-slate-500 hover:text-brand-brown shrink-0">
          ← Back to tenders
        </Link>

        <div className="flex items-start justify-between gap-4 mt-2 mb-6 shrink-0">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-brand-brown">{tender.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{tender.organisation}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Added by {tender.created_by_name} · {formatDateTime(tender.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <TenderStatusBadge status={tender.status} />
            <div className="text-sm text-right">
              <DeadlineLabel deadline={tender.submission_deadline} status={tender.status} />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <TenderForm action={updateAction} tender={tender} submitLabel="Save changes" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Notes</h2>

            <form action={noteAction} className="flex gap-2 mb-5">
              <input
                type="text"
                name="note"
                required
                placeholder="e.g. Bought tender documents, site visit on Friday"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown"
              />
              <button
                type="submit"
                className="shrink-0 bg-brand-brown text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-brown-dark transition-colors"
              >
                Add
              </button>
            </form>

            {notes.length === 0 ? (
              <p className="text-sm text-slate-400">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="text-sm border-l-2 border-slate-200 pl-3">
                    <p className="text-slate-800">{n.note}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {n.author_name} · {formatDateTime(n.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DeleteTenderDialog deleteAction={deleteAction} title={tender.title} />
        </div>
      </main>
    </div>
  );
}
