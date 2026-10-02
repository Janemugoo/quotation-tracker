"use client";

import { useState } from "react";

interface Row {
  package: string;
  provisions: string;
  rate: string;
  pax: string;
  nights: string;
}

const emptyRow: Row = { package: "", provisions: "", rate: "", pax: "", nights: "" };

// Each field in a row is its own labeled block, stacked top to bottom
// (Rate, Pax, Nights, then Provisions) rather than side-by-side columns —
// every label sits directly above its own input, so there's nothing to
// keep aligned across a header row and the inputs beneath it.
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function LineItemsEditor({ initial }: { initial: Row[] }) {
  // Always start with at least one row — an ordinary one-rate quotation is
  // the common case, so the form shouldn't open looking empty.
  const [rows, setRows] = useState<Row[]>(initial.length > 0 ? initial : [{ ...emptyRow }]);

  function addRow() {
    setRows((r) => [...r, { ...emptyRow }]);
  }
  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }
  function updateRow(idx: number, field: keyof Row, value: string) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  }

  const total = rows.reduce((sum, r) => {
    const rate = parseFloat(r.rate);
    const pax = parseInt(r.pax, 10);
    const nights = parseInt(r.nights, 10);
    if (!Number.isFinite(rate) || !Number.isFinite(pax) || !Number.isFinite(nights)) {
      return sum;
    }
    return sum + rate * pax * nights;
  }, 0);

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900";

  return (
    <div>
      {rows.length > 0 && (
        <div className="space-y-5 mb-4">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Rate line {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-5">
                <Field label="Package (room type — e.g. twin, single)">
                  <input
                    type="text"
                    name="line_item_package"
                    value={row.package}
                    onChange={(e) => updateRow(idx, "package", e.target.value)}
                    placeholder="e.g. Twin room"
                    className={inputClass}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Field label="Rate (KSH)">
                    <input
                      type="text"
                      inputMode="decimal"
                      name="line_item_rate"
                      value={row.rate}
                      onChange={(e) => updateRow(idx, "rate", e.target.value)}
                      placeholder="7000"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Pax">
                    <input
                      type="text"
                      inputMode="numeric"
                      name="line_item_pax"
                      value={row.pax}
                      onChange={(e) => updateRow(idx, "pax", e.target.value)}
                      placeholder="1"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Nights">
                    <input
                      type="text"
                      inputMode="numeric"
                      name="line_item_nights"
                      value={row.nights}
                      onChange={(e) => updateRow(idx, "nights", e.target.value)}
                      placeholder="4"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Provisions">
                  <input
                    type="text"
                    name="line_item_provisions"
                    value={row.provisions}
                    onChange={(e) => updateRow(idx, "provisions", e.target.value)}
                    placeholder="e.g. Dinner, bed & breakfast for 1pax in a single: 4th-8th"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="text-sm font-medium text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:border-slate-400 hover:bg-slate-50 transition-colors"
        >
          + Add rate line
        </button>
        {rows.length > 0 && (
          <p className="text-sm text-slate-600">
            Grand total:{" "}
            <span className="font-semibold text-slate-900">
              KSH {total.toLocaleString("en-KE")}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
