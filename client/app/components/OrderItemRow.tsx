import Link from "next/link";
import { formatPrice } from "../../util/functions";
import { getAssetUrl } from "../../util/order";
import type { OrderItemSnapshot } from "../../types/order";

type Props = {
  item: OrderItemSnapshot;
  /** Link the product name/image back to the product page. */
  linkToProduct?: boolean;
  className?: string;
};

/**
 * A single purchased-product row: image, name, seller, unit price,
 * quantity and line total. Reused by the order detail page, the order
 * history list and the payment status page.
 */
export default function OrderItemRow({
  item,
  linkToProduct = true,
  className = "",
}: Props) {
  const imageUrl = getAssetUrl(item.imageUrl);
  const lineTotal = (item.price ?? 0) * (item.quantity ?? 0);
  const productHref = `/product/${item.productId}`;

  const media = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={item.name}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-2xl">
      🛍️
    </div>
  );

  return (
    <div
      className={`flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-5 ${className}`}
    >
      {linkToProduct ? (
        <Link
          href={productHref}
          className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-20 sm:w-20"
          aria-label={item.name}
        >
          {media}
        </Link>
      ) : (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-20 sm:w-20">
          {media}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {linkToProduct ? (
          <Link
            href={productHref}
            className="line-clamp-2 text-sm font-semibold text-zinc-900 transition hover:text-amber-700"
          >
            {item.name}
          </Link>
        ) : (
          <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
            {item.name}
          </p>
        )}

        <p className="mt-1 text-xs text-zinc-500">
          {item.shopName ? (
            <>
              Sold by{" "}
              <span className="font-medium text-zinc-700">{item.shopName}</span>
              <span className="mx-1.5 text-zinc-300">·</span>
            </>
          ) : null}
          {formatPrice(item.price)} each
        </p>

        <p className="mt-1 text-xs font-medium text-zinc-600">
          Qty: {item.quantity}
        </p>
      </div>

      <p className="shrink-0 text-sm font-semibold text-zinc-900">
        {formatPrice(lineTotal)}
      </p>
    </div>
  );
}
