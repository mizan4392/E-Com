export const Spinner = () => {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-8">
          <div className="h-6 w-28 rounded bg-zinc-200" />
          <div className="mt-6 h-10 w-2/3 rounded bg-zinc-200" />
          <div className="mt-6 h-80 w-full rounded-2xl bg-zinc-200" />
        </div>
      </div>
    </main>
  );
};
