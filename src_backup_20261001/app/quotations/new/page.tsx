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
    <div className="min-h-screen">
      <TopNav userName={session?.user?.name ?? ""} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to quotations
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-2 mb-6">
          New quotation
        </h1>
        <p className="text-sm text-slate-500 -mt-4 mb-6">
          Fill out the details below, then either save it to the tracker or
          save and go straight to the printable quotation letter.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
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
