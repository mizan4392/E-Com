type QuantitySelectorProps = {
  quantity: number;
  onChange: (nextValue: number) => void;
};

export default function QuantitySelector({
  quantity,
  onChange,
}: QuantitySelectorProps) {
  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-zinc-300 bg-white px-3 sm:w-32">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className="h-8 w-8 text-lg text-zinc-500 transition hover:text-zinc-900"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="text-sm font-semibold">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        className="h-8 w-8 text-lg text-zinc-500 transition hover:text-zinc-900"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
