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
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-zinc-200 py-5">
      <span className="text-amber-500">★★★★★</span>
      <span className="text-sm font-semibold">{rating ?? "4.8"}</span>
      <span className="text-sm text-zinc-500">{reviewsCount ?? 5} reviews</span>
      <span className="h-4 w-px bg-zinc-300" />
      <span className="text-sm text-zinc-500">{soldCount ?? 5} sold</span>
    </div>
  );
}
