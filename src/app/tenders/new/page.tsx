import Link from "next/link";
import { auth } from "@/auth";
import { isSessionAdmin } from "@/lib/authz";
import { TopNav } from "@/components/TopNav";
import { TenderForm } from "@/components/TenderForm";
import { createTenderAction } from "@/app/tenders/actions";

export default async function NewTenderPage() {
  const session = await auth();

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
        <h1 className="text-xl font-semibold text-brand-brown mt-2 mb-2 shrink-0">
          New tender
        </h1>
        <p className="text-sm text-slate-500 mb-6 shrink-0">
          Record the tender as soon as you find it — you can update the status
          as it moves along.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex-1 min-h-0 overflow-y-auto">
          <TenderForm action={createTenderAction} submitLabel="Save tender" />
        </div>
      </main>
    </div>
  );
}
