type Props = {
  value: number;
  interactive?: boolean;
  disabled?: boolean;
  onChange?: (value: number) => void;
};

export default function StarRating({
  value,
  interactive = false,
  disabled = false,
  onChange,
}: Props) {
  const selectedValue = Math.max(0, Math.min(5, value));

  if (!interactive) {
    return (
      <span
        role="img"
        aria-label={`${selectedValue.toFixed(1)} out of 5 stars`}
        className="inline-flex text-amber-500"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={index < Math.round(selectedValue) ? "" : "text-zinc-300"}
          >
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className="inline-flex" role="group" aria-label="Choose a rating">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            type="button"
            aria-label={`${starValue} ${starValue === 1 ? "star" : "stars"}`}
            aria-pressed={starValue === selectedValue}
            disabled={disabled}
            onClick={() => onChange?.(starValue)}
            className={`cursor-pointer px-0.5 text-2xl leading-none transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 ${
              starValue <= selectedValue ? "text-amber-500" : "text-zinc-300"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
