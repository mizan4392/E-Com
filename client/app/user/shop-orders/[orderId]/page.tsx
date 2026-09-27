import ShopOrderDetail from "./ShopOrderDetail";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ shopId?: string | string[] }>;
};

/**
 * Thin server component: resolves the route params so `ShopOrderDetail` can
 * stay a client component. Same split as `/user/orders/[id]`.
 *
 * `shopId` is required by the API and therefore also by this route — the
 * order id alone does not identify which of the seller's shops it belongs to.
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
      shopId={typeof shopId === "string" ? shopId : ""}
    />
  );
}
