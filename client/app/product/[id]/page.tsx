import ProductDetails from "../../components/ProductDetails";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  return <ProductDetails productId={id} />;
}
