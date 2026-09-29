import StarRating from "./StarRating";

type ProductSummaryProps = {
  rating?: number;
  reviewsCount?: number;
  soldCount?: number;
};

export default function ProductSummary({
  rating,
  reviewsCount,
  soldCount,
}: ProductSummaryProps) {
  const reviewCount = reviewsCount ?? 0;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-zinc-200 py-5">
      <StarRating value={rating ?? 0} />
      <span className="text-sm font-semibold">
        {reviewCount ? (rating ?? 0).toFixed(1) : "New"}
      </span>
      <a
        href="#reviews"
        className="text-sm text-zinc-500 transition hover:text-amber-700"
      >
        {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
      </a>
      {soldCount !== undefined ? (
        <>
          <span className="h-4 w-px bg-zinc-300" />
          <span className="text-sm text-zinc-500">{soldCount} sold</span>
        </>
      ) : null}
    </div>
  );
}
