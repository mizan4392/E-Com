import ProductsPageSkeleton from "@/features/products/ProductsPageSkeleton";

/**
 * Whole-route placeholder while the products list server-renders.
 *
 * Reuses the header placeholder + body skeleton so the page does not jump when
 * data lands, matching the orders route's pattern.
 */
export default function ProductsLoading() {
  return <ProductsPageSkeleton />;
}
