import DashboardClient from "./DashboardClient";

/**
 * Seller dashboard route at `/user/dashboard`.
 *
 * Kept as a server component that renders the client shell, matching the
 * `ShopOrdersClient` / `ShopOrdersPage` split. There is no `searchParams` to
 * read today (shop selection is client state), but keeping the boundary means
 * adding a shareable `?shopId=` deep link later will not require a refactor.
 */
export default function DashboardPage() {
  return <DashboardClient />;
}
