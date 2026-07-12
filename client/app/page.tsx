import Navbar from "./components/Navbar";
import HeroCarousel from "./components/HeroCarousel";
import ShopsList from "./components/ShopsList";

export default function Home() {
  return (
    <main id="home" className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar />

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <HeroCarousel />
        <ShopsList />
      </section>
    </main>
  );
}
