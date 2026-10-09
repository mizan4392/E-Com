"use client";

/**
 * Product thumbnail for an order item.
 *
 * The only reason this is a Client Component is `onError`: React refuses to
 * pass event handlers across the server/client boundary, and `OrderItemsList`
 * is a Server Component. Keeping the handler here lets the list stay on the
 * server, which is where its data comes from.
 *
 * Plain `<img>` rather than `next/image`: these are seller-supplied URLs from a
 * third-party host, and `next/image` would demand that host be added to
 * `images.remotePatterns`. It also has no bearing on the image's intrinsic size
 * here, which is the only thing `next/image` genuinely optimises.
 */

/**
 * Inline SVG, so there is no network request and no missing-asset 404.
 *
 * Defined here rather than in `OrderItemsList` because both the `<img>` and the
 * `onError` fallback need it, and this is the module that owns both.
 */
const PLACEHOLDER_SRC =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <rect width="48" height="48" rx="8" fill="#f1f5f9"/>
      <path d="M14 28l6-7 5 5 3-3 6 6v3a2 2 0 01-2 2H16a2 2 0 01-2-2z" fill="#cbd5e1"/>
      <circle cx="19" cy="18" r="3" fill="#cbd5e1"/>
    </svg>`,
  );

export default function OrderItemThumb({ src }: { src?: string | null }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? PLACEHOLDER_SRC}
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = PLACEHOLDER_SRC;
      }}
      className="size-12 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-cover"
    />
  );
}
