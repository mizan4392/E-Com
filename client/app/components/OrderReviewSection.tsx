"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  useOrderReviews,
  useUpsertOrderItemReview,
} from "../../lib/product/queries";
import type { OrderReviewItem } from "../../types/review";
import { getAssetUrl } from "../../util/order";
import StarRating from "./StarRating";

function OrderReviewCard({
  orderId,
  item,
}: {
  orderId: string;
  item: OrderReviewItem;
}) {
  const [ratingOverride, setRatingOverride] = useState<number | null>(null);
  const [messageOverride, setMessageOverride] = useState<string | null>(null);
  const reviewMutation = useUpsertOrderItemReview();
  const rating = ratingOverride ?? item.rating ?? 0;
  const message = messageOverride ?? item.message ?? "";
  const imageUrl = getAssetUrl(item.imageUrl);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating < 1) {
      toast.error("Choose a star rating");
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        orderId,
        orderItemId: item.orderItemId,
        rating,
        message: message.trim(),
      });
      setRatingOverride(null);
      setMessageOverride(null);
      toast.success(item.rating ? "Review updated" : "Review submitted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save your review",
      );
    }
  };

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <Link
            href={`/product/${item.productId}`}
            className="line-clamp-2 text-sm font-semibold text-zinc-900 hover:text-amber-700"
          >
            {item.productName}
          </Link>
          <p className="mt-1 text-xs font-medium text-emerald-700">
            Verified purchase
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-zinc-800">
          Your rating
          <span className="mt-2 block">
            <StarRating
              value={rating}
              interactive
              disabled={reviewMutation.isPending}
              onChange={setRatingOverride}
            />
          </span>
        </label>
        <label className="block text-sm font-medium text-zinc-800">
          Your review
          <textarea
            value={message}
            onChange={(event) => setMessageOverride(event.target.value)}
            minLength={3}
            maxLength={2000}
            required
            rows={3}
            placeholder="What did you think of this product?"
            className="mt-2 w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
          />
          <span className="mt-1 block text-right text-xs font-normal text-zinc-500">
            {message.length}/2000
          </span>
        </label>
        <button
          type="submit"
          disabled={reviewMutation.isPending}
          className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {reviewMutation.isPending
            ? "Saving review..."
            : item.rating
              ? "Update review"
              : "Submit review"}
        </button>
      </form>
    </article>
  );
}

export default function OrderReviewSection({ orderId }: { orderId: string }) {
  const reviewsQuery = useOrderReviews(orderId, true);

  return (
    <section aria-labelledby="order-review-heading" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Your feedback
        </p>
        <h2
          id="order-review-heading"
          className="mt-1 text-xl font-semibold text-zinc-900"
        >
          Rate your products
        </h2>
      </div>

      {reviewsQuery.isLoading ? (
        <p className="text-sm text-zinc-500">Loading delivered products...</p>
      ) : reviewsQuery.isError ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
          <p>Reviews could not be loaded.</p>
          <button
            type="button"
            onClick={() => void reviewsQuery.refetch()}
            className="cursor-pointer font-semibold text-amber-700 hover:text-amber-900"
          >
            Try again
          </button>
        </div>
      ) : reviewsQuery.data?.length ? (
        <div className="space-y-3">
          {reviewsQuery.data.map((item) => (
            <OrderReviewCard
              key={item.orderItemId}
              orderId={orderId}
              item={item}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          There are no delivered products to review in this order.
        </p>
      )}
    </section>
  );
}
