import { STATUS_LABELS, STATUS_ORDER, type QuotationWithMeta } from "@/lib/types";
import { LineItemsEditor } from "@/components/LineItemsEditor";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Event dates
          </label>
          <input
            type="text"
            name="event_dates"
            defaultValue={quotation?.event_dates ?? ""}
            placeholder="e.g. 8th - 11th Sep 2026"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            No. of pax
          </label>
          <input
            type="text"
            name="number_of_pax"
            defaultValue={quotation?.number_of_pax ?? ""}
            placeholder="e.g. 28 pax"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Package
          </label>
          <input
            type="text"
            name="package"
            defaultValue={quotation?.package ?? ""}
            placeholder="e.g. Full day conference"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Rate
          </label>
          <input
            type="text"
            name="rate"
            defaultValue={quotation?.rate ?? ""}
            placeholder="e.g. 3,800 per pax"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Provisions / what&apos;s included
        </label>
        <textarea
          name="provisions"
          rows={2}
          defaultValue={quotation?.provisions ?? ""}
          placeholder="e.g. Dinner, bed & breakfast and lunch for 28 students sharing 15 rooms"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <p className="text-xs text-slate-400 mt-1">
          Used on the generated quotation letter. Leave blank to let it fall
          back to the package and pax count.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Business value (KES)
        </label>
        <input
          type="text"
          inputMode="decimal"
          name="business_value"
          defaultValue={quotation?.business_value ?? ""}
          placeholder="e.g. 530600"
          className="w-full sm:w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-medium text-slate-700 mb-1">
          Multiple rate lines (optional)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Use this when a quotation has more than one rate — e.g. different
          room types, or the same room at different nightly rates (1 pax for
          4 nights, then 3 pax for 1 night). Each line&apos;s total is
          calculated automatically and summed into a grand total on the
          letter. Leave this empty to use the single package / rate /
          provisions fields above instead.
        </p>
        <LineItemsEditor
          initial={
            quotation?.line_items?.map((li) => ({
              provisions: li.provisions,
              rate: String(li.rate),
              pax: String(li.pax),
              nights: String(li.nights),
            })) ?? []
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
      </div>
    </form>
  );
}
