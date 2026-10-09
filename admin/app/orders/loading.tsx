import { PageContainer } from "@/components/layout/PageHeader";
import OrdersPageSkeleton from "@/features/orders/OrdersPageSkeleton";

/**
 * Loading UI for `/orders`.
 *
 * Covers the *first* navigation into the route only. Turning pages within
 * `/orders` keeps the existing UI mounted — those updates resolve inside the
 * page's own `<Suspense>` boundary — so this only needs to mirror the layout,
 * which {@link OrdersPageSkeleton} does.
 *
 * `PageContainer` is supplied here because `loading.tsx` replaces the *entire*
 * route, including the container the page itself normally provides.
 */
export default function OrdersLoading() {
  return (
    <PageContainer>
      <OrdersPageSkeleton />
    </PageContainer>
  );
}
