import ShopOrdersClient from "./ShopOrdersClient";

type Props = {
  searchParams: Promise<{ shopId?: string | string[] }>;
};

/**
 * Thin server component so the initial `?shopId=` scope is read on the server
 * and handed to the client list. Reading it with `useSearchParams()` inside the
 * client component instead would opt this route out of static prerendering and
 * fail the build without a `<Suspense>` boundary.
 */
export default async function ShopOrdersPage({ searchParams }: Props) {
  const { shopId } = await searchParams;

  return (
    <ShopOrdersClient
      initialShopId={typeof shopId === "string" ? shopId : undefined}
    />
  );
}
