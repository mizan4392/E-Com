import HeroCarousel from "./components/HeroCarousel";
import ShopsList from "./components/ShopsList";
import CategoriesList from "./components/CategoriesList";
import ProductsList from "./components/ProductsList";

export default function Home() {
  return (
    <main id="home" className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <HeroCarousel />
        <ShopsList />
        <div className="pt-8">
          <CategoriesList />
        </div>
        <div className="pt-12">
          <ProductsList />
        </div>
      </section>
    </main>
  );
}
