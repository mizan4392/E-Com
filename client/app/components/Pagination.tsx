"use client";

type Props = {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
};

/**
 * Builds a compact page list so we never render one button per page.
 * Always shows the first and last page, the current page, and a window of
 * neighbours around it, with "..." markers where pages are elided.
 */
function buildPageList(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, page]);
  for (const offset of [-1, 1]) {
    const candidate = page + offset;
    if (candidate > 1 && candidate < totalPages) {
      pages.add(candidate);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const list: (number | "gap")[] = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - (sorted[index - 1] as number) > 1) {
      list.push("gap");
    }
    list.push(value);
  });

  return list;
}

export default function Pagination({ page, totalPages, onPage }: Props) {
  //   if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-md bg-white px-3 py-1 text-sm shadow-sm disabled:opacity-50"
      >
        Previous
      </button>

      <div className="text-sm text-zinc-700">
        {buildPageList(page, totalPages).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="mx-1 inline-block px-1">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? "page" : undefined}
              className={`mx-1 inline-flex items-center justify-center rounded-md px-3 py-1 text-sm ${
                item === page ? "bg-zinc-900 text-white" : "bg-white"
              }`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-md bg-white px-3 py-1 text-sm shadow-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
