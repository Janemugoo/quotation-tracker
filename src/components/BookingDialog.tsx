"use client";

import { useActionState, useEffect, useRef } from "react";
import { HALLS, HALL_STATUS_LABELS, type HallBookingStatus } from "@/lib/halls";
import {
  createHallBookingAction,
  type BookingFormState,
} from "@/app/halls/actions";

export interface BookingPrefill {
  hall?: string;
  start?: string;
  end?: string;
  group?: string;
  pax?: number | null;
  status?: HallBookingStatus;
  quotationId?: string;
}

const inputClass =
  "w-full rounded-lg border border-brand-brown/25 bg-brand-brown-light/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown focus:bg-white transition-colors";

const GROUPS = Array.from(new Set(HALLS.map((h) => h.group)));

// The "Book a hall" form in a native <dialog>, used from the calendar page and
// from a quotation. The form is only mounted while the dialog is open, so it
// always starts fresh (and without an old error message).
export function BookingDialog({
  open,
  onClose,
  onSaved,
  prefill,
  groupNames,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (id: string, start: string) => void;
  prefill: BookingPrefill;
  groupNames: string[];
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="fixed inset-0 m-auto rounded-xl border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40 w-[calc(100%-2rem)] max-w-lg h-fit max-h-[calc(100%-2rem)] overflow-y-auto"
    >
      {open && (
        <BookingForm
          prefill={prefill}
          groupNames={groupNames}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </dialog>
  );
}

function BookingForm({
  prefill,
  groupNames,
  onClose,
  onSaved,
}: {
  prefill: BookingPrefill;
  groupNames: string[];
  onClose: () => void;
  onSaved: (id: string, start: string) => void;
}) {
  const [state, formAction, pending] = useActionState<BookingFormState, FormData>(
    createHallBookingAction,
    {}
  );

  useEffect(() => {
    if (state.savedId) onSaved(state.savedId, state.savedStart ?? "");
    // onSaved comes from the parent and changes every render; only a new
    // saved id should trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedId]);

  // After an error the server echoes what was typed, so it is kept.
  const v = state.values;
  const status = v?.status ?? prefill.status ?? "CONFIRMED";

  return (
    <form action={formAction} className="p-6">
      <h2 className="text-base font-semibold text-brand-brown">Book a hall</h2>
      <p className="text-sm text-slate-500 mt-1 mb-4">
        Pick the hall and the days. Two bookings can&apos;t overlap in the same hall.
      </p>

      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      {prefill.quotationId && (
        <input type="hidden" name="quotation_id" value={prefill.quotationId} />
      )}

      <div key={state.nonce ?? "fresh"} className="space-y-4">
        <div>
          <label htmlFor="bk-hall" className="block text-sm font-medium text-slate-700 mb-1">
            Hall *
          </label>
          <select
            id="bk-hall"
            name="hall"
            required
            defaultValue={v?.hall ?? prefill.hall ?? ""}
            className={inputClass}
          >
            <option value="">Choose a hall</option>
            {GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {HALLS.filter((h) => h.group === g).map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bk-start" className="block text-sm font-medium text-slate-700 mb-1">
              From *
            </label>
            <input
              id="bk-start"
              type="date"
              name="start_date"
              required
              defaultValue={v?.start_date ?? prefill.start ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bk-end" className="block text-sm font-medium text-slate-700 mb-1">
              To (last day) *
            </label>
            <input
              id="bk-end"
              type="date"
              name="end_date"
              required
              defaultValue={v?.end_date ?? prefill.end ?? prefill.start ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="bk-group" className="block text-sm font-medium text-slate-700 mb-1">
            Group or client *
          </label>
          <input
            id="bk-group"
            type="text"
            name="group_name"
            required
            maxLength={120}
            list="bk-groups"
            defaultValue={v?.group_name ?? prefill.group ?? ""}
            placeholder="Start typing to pick from your quotations"
            className={inputClass}
          />
          <datalist id="bk-groups">
            {groupNames.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bk-pax" className="block text-sm font-medium text-slate-700 mb-1">
              Number of pax
            </label>
            <input
              id="bk-pax"
              type="number"
              name="pax"
              min={0}
              step={1}
              defaultValue={v?.pax ?? prefill.pax ?? ""}
              placeholder="e.g. 60"
              className={inputClass}
            />
          </div>
          <fieldset>
            <legend className="block text-sm font-medium text-slate-700 mb-1">Status</legend>
            <div className="flex flex-wrap gap-2">
              {(["CONFIRMED", "TENTATIVE"] as HallBookingStatus[]).map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 cursor-pointer has-[:checked]:border-brand-brown has-[:checked]:bg-brand-brown-light"
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    defaultChecked={status === s}
                    className="accent-[#663333]"
                  />
                  {HALL_STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <label htmlFor="bk-notes" className="block text-sm font-medium text-slate-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="bk-notes"
            name="notes"
            defaultValue={v?.notes ?? ""}
            rows={2}
            maxLength={500}
            placeholder="Seating style, set-up time, equipment"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-brown text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-brand-brown-dark transition-colors disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save booking"}
        </button>
      </div>
    </form>
  );
}
