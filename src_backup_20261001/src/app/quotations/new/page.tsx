import Link from "next/link";
import { auth } from "@/auth";
import { TopNav } from "@/components/TopNav";
import { QuotationForm } from "@/components/QuotationForm";
import {
  createQuotationAction,
  createAndPrintQuotationAction,
} from "@/app/actions";

export default async function NewQuotationPage() {
  const session = await auth();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNav userName={session?.user?.name ?? ""} />
      <main className="w-full lg:w-3/4 max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col flex-1 min-h-0">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 shrink-0">
          ← Back to quotations
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-2 mb-6 shrink-0">
          New quotation
        </h1>
        <p className="text-sm text-slate-500 -mt-4 mb-6 shrink-0">
          Fill out the details below, then either save it to the tracker or
          save and go straight to the printable quotation letter.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex-1 min-h-0 overflow-y-auto">
          <QuotationForm
            action={createQuotationAction}
            printAction={createAndPrintQuotationAction}
            submitLabel="Save quotation"
          />
        </div>
      </main>
    </div>
  );
}
