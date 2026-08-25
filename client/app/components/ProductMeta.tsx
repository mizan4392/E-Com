type ProductMetaProps = {
  label: string;
  value: string | number | undefined;
  className?: string;
};

export default function ProductMeta({
  label,
  value,
  className = "",
}: ProductMetaProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white px-3 py-2 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value ?? "—"}</p>
    </div>
  );
}
