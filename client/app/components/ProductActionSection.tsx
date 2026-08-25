import { formatPrice } from "../../util/functions";
import QuantitySelector from "./QuantitySelector";

type ProductActionSectionProps = {
  isOwner: boolean;
  quantity: number;
  price: number;
  added: boolean;
  onQuantityChange: (nextValue: number) => void;
  onAddToCart: () => void;
  onEditProduct: () => void;
};

export default function ProductActionSection({
  isOwner,
  quantity,
  price,
  added,
  onQuantityChange,
  onAddToCart,
  onEditProduct,
}: ProductActionSectionProps) {
  if (isOwner) {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="h-12 flex-1 cursor-pointer rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-amber-700"
          onClick={onEditProduct}
        >
          Edit Product
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <QuantitySelector quantity={quantity} onChange={onQuantityChange} />
      <button
        type="button"
        onClick={onAddToCart}
        className="h-12 flex-1 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-amber-700"
      >
        {added
          ? "Added to cart"
          : `Add to cart · ${formatPrice(price * quantity)}`}
      </button>
    </div>
  );
}
