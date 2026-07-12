type Props = {
  params: { id: string };
};

export default function ProductPage({ params }: Props) {
  const { id } = params;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Product {id}</h1>
        <p className="mt-4 text-zinc-600">
          This is a placeholder product detail page for product {id}.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Add product images, description, price and purchase actions here.
          </p>
        </div>
      </div>
    </main>
  );
}
