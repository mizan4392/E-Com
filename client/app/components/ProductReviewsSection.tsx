"use client";

import { useState } from "react";
import { useProductReviews } from "../../lib/product/queries";
import { formatOrderDate } from "../../util/order";
import Pagination from "./Pagination";
import StarRating from "./StarRating";

export default function ProductReviewsSection({
  productId,
}: {
  productId: string;
}) {
  const [page, setPage] = useState(1);
  const reviewsQuery = useProductReviews(productId, page);
  const reviews = reviewsQuery.data;

  return (
    <section
      id="reviews"
      aria-labelledby="product-reviews-heading"
      className="mt-14 border-t border-zinc-200 pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Verified buyers
          </p>
          <h2
            id="product-reviews-heading"
            className="mt-1 text-2xl font-semibold text-zinc-900"
          >
            Customer reviews
          </h2>
        </div>
        {reviews ? (
          <p className="text-sm text-zinc-500">
            {reviews.total} {reviews.total === 1 ? "review" : "reviews"}
          </p>
        ) : null}
      </div>

      {reviewsQuery.isLoading ? (
        <p className="mt-6 text-sm text-zinc-500">Loading reviews...</p>
      ) : reviewsQuery.isError ? (
        <p className="mt-6 text-sm text-red-700">
          Reviews are temporarily unavailable.
        </p>
      ) : reviews?.data.length ? (
        <div className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200">
          {reviews.data.map((review) => (
            <article key={review.id} className="py-5">
              <div className="flex flex-wrap items-center gap-3">
                <StarRating value={review.rating} />
                <span className="text-sm font-semibold text-zinc-900">
                  {review.reviewerName}
                </span>
                <span className="text-xs font-medium text-emerald-700">
                  Verified purchase
                </span>
                <time
                  dateTime={review.createdAt}
                  className="ml-auto text-xs text-zinc-500"
                >
                  {formatOrderDate(review.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-line wrap-break-word text-sm leading-6 text-zinc-700">
                {review.message}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 border-y border-zinc-200 py-8 text-sm text-zinc-500">
          No reviews yet. Verified buyers can review this product after
          confirming delivery.
        </p>
      )}

      {reviews && reviews.totalPages > 1 ? (
        <Pagination
          page={reviews.currentPage}
          totalPages={reviews.totalPages}
          onPage={setPage}
        />
      ) : null}
    </section>
  );
}
