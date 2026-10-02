"use client";

import { useRef } from "react";

// Same confirm-before-deleting pattern as DeleteQuotationDialog.
export function DeleteUserDialog({
  deleteAction,
  userName,
}: {
  deleteAction: (formData: FormData) => void;
  userName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-xs font-medium text-red-600 hover:text-red-700"
      >
        Remove
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto rounded-xl border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40 w-[calc(100%-2rem)] max-w-sm h-fit"
      >
        <div className="p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">
            Remove this login?
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            <span className="font-medium text-slate-700">{userName}</span>{" "}
            won&apos;t be able to sign in anymore. This can&apos;t be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Cancel
            </button>
            <form action={deleteAction}>
              <button
                type="submit"
                className="bg-red-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-red-700 transition-colors"
              >
                Confirm remove
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
