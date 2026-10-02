"use client";

import { useState } from "react";

interface Row {
  provisions: string;
  rate: string;
  pax: string;
  nights: string;
}

const emptyRow: Row = { provisions: "", rate: "", pax: "", nights: "" };

export function LineItemsEditor({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);

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

  return (
    <div>
      {rows.length > 0 && (
        <div className="space-y-3 mb-3">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-[1fr_100px_70px_80px_auto] gap-2 items-start bg-slate-50 border border-slate-200 rounded-lg p-3"
            >
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">
                  Provisions
                </label>
                <input
                  type="text"
                  name="line_item_provisions"
                  value={row.provisions}
                  onChange={(e) => updateRow(idx, "provisions", e.target.value)}
                  placeholder="e.g. Dinner, bed & breakfast for 1pax in a single: 4th-8th"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">
                  Rate (KSH)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="line_item_rate"
                  value={row.rate}
                  onChange={(e) => updateRow(idx, "rate", e.target.value)}
                  placeholder="7000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">
                  Pax
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="line_item_pax"
                  value={row.pax}
                  onChange={(e) => updateRow(idx, "pax", e.target.value)}
                  placeholder="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 sm:hidden">
                  Nights
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="line_item_nights"
                  value={row.nights}
                  onChange={(e) => updateRow(idx, "nights", e.target.value)}
                  placeholder="4"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="justify-self-start sm:justify-self-auto text-xs font-medium text-red-600 hover:text-red-700 px-2 py-2"
              >
                Remove
              </button>
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
