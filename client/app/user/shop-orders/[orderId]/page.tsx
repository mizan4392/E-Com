import ShopOrderDetail from "./ShopOrderDetail";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ shopId?: string | string[] }>;
};

/**
 * Thin server component: resolves the route params so `ShopOrderDetail` can
 * stay a client component. Same split as `/user/orders/[id]`.
 *
 * `shopId` is an optional scope filter, passed through when present. A card in
 * the list is one order rather than one order-per-shop, so the order id alone
 * is enough to identify what to show.
 */
export default async function ShopOrderDetailPage({
  params,
  searchParams,
}: Props) {
  const { orderId } = await params;
  const { shopId } = await searchParams;

  return (
    <ShopOrderDetail
      orderId={orderId}
      shopId={typeof shopId === "string" ? shopId : undefined}
    />
  );
}
