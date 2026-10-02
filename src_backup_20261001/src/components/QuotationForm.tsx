import { STATUS_LABELS, STATUS_ORDER, type QuotationWithMeta } from "@/lib/types";
import { LineItemsEditor } from "@/components/LineItemsEditor";

// A quotation saved before "Rate Breakdown" existed has its rate/pax/
// provisions on the quotation itself rather than as a line item — carry
// that single value over as the first (and only) row so editing an old
// quotation doesn't appear to have lost its rate.
function legacyLineItem(quotation: QuotationWithMeta | undefined) {
  if (!quotation || quotation.line_items?.length) return null;
  if (!quotation.rate && !quotation.number_of_pax && !quotation.provisions) return null;
  return {
    package: "",
    provisions: quotation.provisions ?? "",
    rate: quotation.rate ? quotation.rate.replace(/[^0-9.]/g, "") : "",
    pax: quotation.number_of_pax ? quotation.number_of_pax.replace(/[^0-9.]/g, "") : "",
    nights: "1",
  };
}

function toDateInputValue(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function QuotationForm({
  action,
  printAction,
  quotation,
  submitLabel,
  printLabel = "Save & print quotation",
}: {
  action: (formData: FormData) => void;
  printAction?: (formData: FormData) => void;
  quotation?: QuotationWithMeta;
  submitLabel: string;
  printLabel?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date of inquiry *
          </label>
          <input
            type="date"
            name="date_of_inquiry"
            required
            defaultValue={
              toDateInputValue(quotation?.date_of_inquiry) ||
              new Date().toISOString().slice(0, 10)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={quotation?.status ?? "INQUIRY"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Group / client name *
        </label>
        <input
          type="text"
          name="group_name"
          required
          defaultValue={quotation?.group_name}
          placeholder="e.g. World Vision"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Event dates
        </label>
        <p className="text-xs text-slate-400 mb-2">
          Pick the first and last day of the event — this is what shows in
          the letter&apos;s title.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              From
            </label>
            <input
              type="date"
              name="event_date_from"
              defaultValue={quotation?.event_date_from ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              To
            </label>
            <input
              type="date"
              name="event_date_to"
              defaultValue={quotation?.event_date_to ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-medium text-slate-700 mb-1">
          Rate Breakdown
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          One row for an ordinary quotation, or add more for a quotation
          with several rates — different room types or packages, or the
          same room at a different nightly rate for part of the stay (1 pax
          for 4 nights, then 3 pax for 1 night). Each row&apos;s total is
          rate × pax × nights, worked out for you and summed into a grand
          total on the letter.
        </p>
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Package
          </label>
          <p className="text-xs text-slate-400 mb-1.5">
            This is the one that shows in the letter&apos;s heading
            (&quot;QUOTATION FOR: ...&quot;). Each rate line below has its own
            Package field too, for the room type on that line.
          </p>
          <input
            type="text"
            name="package"
            defaultValue={quotation?.package ?? ""}
            placeholder="e.g. Full day conference"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <LineItemsEditor
          initial={
            quotation?.line_items?.map((li) => ({
              package: li.package ?? "",
              provisions: li.provisions,
              rate: String(li.rate),
              pax: String(li.pax),
              nights: String(li.nights),
            })) ??
            (legacyLineItem(quotation) ? [legacyLineItem(quotation)!] : [])
          }
        />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-medium text-slate-700 mb-3">
          Travel agent / contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Travel agent name
            </label>
            <input
              type="text"
              name="travel_agent_name"
              defaultValue={quotation?.travel_agent_name ?? ""}
              placeholder="e.g. Direct inquiry"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Contact person
            </label>
            <input
              type="text"
              name="contact_person"
              defaultValue={quotation?.contact_person ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Phone number
            </label>
            <input
              type="text"
              name="phone_number"
              defaultValue={quotation?.phone_number ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue={quotation?.email ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          className="bg-slate-900 text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-slate-800 transition-colors"
        >
          {submitLabel}
        </button>
        {printAction && (
          <button
            type="submit"
            formAction={printAction}
            className="bg-white border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-5 py-2.5 hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            {printLabel}
          </button>
        )}
        <button
          type="submit"
          formAction="/api/quotations/preview/letter"
          formTarget="_blank"
          formNoValidate
          className="text-sm font-medium text-slate-600 hover:text-slate-900 underline decoration-slate-300 underline-offset-4 transition-colors"
        >
          Preview letter (opens in a new tab, doesn&apos;t save)
        </button>
      </div>
    </form>
  );
}
