import {
  TENDER_STATUS_LABELS,
  TENDER_STATUS_ORDER,
  type Tender,
} from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-brand-brown/25 bg-brand-brown-light/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown focus:bg-white transition-colors";

export function TenderForm({
  action,
  tender,
  submitLabel,
  withNotes = false,
}: {
  action: (formData: FormData) => void;
  tender?: Tender;
  submitLabel: string;
  // Shows a Notes box (used on the new-tender form) so the first note is
  // saved together with the tender.
  withNotes?: boolean;
}) {
  // A tender saved with a status that is no longer offered keeps showing it.
  const statusOptions = tender && !TENDER_STATUS_ORDER.includes(tender.status)
    ? [...TENDER_STATUS_ORDER, tender.status]
    : TENDER_STATUS_ORDER;

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Issued by (organisation) *
        </label>
        <input
          type="text"
          name="organisation"
          required
          defaultValue={tender?.organisation}
          placeholder="e.g. Kenya Wildlife Service"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tender title *
        </label>
        <input
          type="text"
          name="title"
          required
          defaultValue={tender?.title}
          placeholder="e.g. Provision of hotel accommodation and conference facilities"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tender reference number
          </label>
          <input
            type="text"
            name="reference_number"
            defaultValue={tender?.reference_number ?? ""}
            placeholder="e.g. KWS/T/012/2026"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Submission deadline
          </label>
          <input
            type="date"
            name="submission_deadline"
            defaultValue={tender?.submission_deadline ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={tender?.status ?? "FOUND"}
            className={inputClass}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {TENDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Contact person
            </label>
            <input
              type="text"
              name="contact_person"
              defaultValue={tender?.contact_person ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Phone number
            </label>
            <input
              type="text"
              name="contact_phone"
              defaultValue={tender?.contact_phone ?? ""}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Email
            </label>
            <input
              type="email"
              name="contact_email"
              defaultValue={tender?.contact_email ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {withNotes && (
        <div className="border-t border-slate-200 pt-5">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Optional — anything worth recording about this tender. More notes
            can be added later from the tender&apos;s page.
          </p>
          <textarea
            name="note"
            rows={3}
            className={inputClass}
          />
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          className="bg-brand-brown text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-brand-brown-dark transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
