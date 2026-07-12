import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main id="home" className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar />

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            New season arrivals
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Shop stylish essentials for everyday living.
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Discover curated products for home, fashion, and tech with fast
            delivery.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div
            id="shop"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-semibold">Trending now</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Fresh drops and bestsellers.
            </p>
          </div>
          <div
            id="categories"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-semibold">Popular categories</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Find exactly what you need.
            </p>
          </div>
          <div
            id="deals"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-semibold">Limited-time deals</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Save on premium picks this week.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
