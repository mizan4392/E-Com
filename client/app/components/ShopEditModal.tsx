"use client";
import { useState, useEffect } from "react";

type Props = {
  open: boolean;
  initial: { name: string; description: string; address: string };
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    address: string;
  }) => Promise<void>;
};

export default function ShopEditModal({
  open,
  initial,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState(initial);

  useEffect(() => setForm(initial), [initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave(form);
        }}
        className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold">Edit Shop</h3>

        <div className="mt-4 grid gap-3">
          <label className="text-sm">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm">
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
            />
          </label>

          <label className="text-sm">
            Address
            <input
              value={form.address}
              onChange={(e) =>
                setForm((s) => ({ ...s, address: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white px-3 py-1 text-sm shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-amber-600 px-3 py-1 text-sm text-white"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
