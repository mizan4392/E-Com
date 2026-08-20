"use client";

type Props = {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
};

export default function Pagination({ page, totalPages, onPage }: Props) {
  //   if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-md bg-white px-3 py-1 text-sm shadow-sm disabled:opacity-50"
      >
        Previous
      </button>

      <div className="text-sm text-zinc-700">
        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`mx-1 inline-flex items-center justify-center rounded-md px-3 py-1 text-sm ${p === page ? "bg-zinc-900 text-white" : "bg-white"}`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-md bg-white px-3 py-1 text-sm shadow-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
