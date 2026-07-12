import Link from "next/link";

const footerLinks = [
  {
    title: "Shop",
    items: [
      { label: "New Arrivals", href: "#" },
      { label: "Men", href: "#" },
      { label: "Women", href: "#" },
      { label: "Sale", href: "#" },
    ],
  },
  {
    title: "Customer Service",
    items: [
      { label: "Help Center", href: "#" },
      { label: "Shipping", href: "#" },
      { label: "Returns", href: "#" },
      { label: "Track Order", href: "#" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Affiliates", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-16 text-zinc-700">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
              E
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-zinc-900">
                E-Commerce
              </p>
              <p className="text-sm text-zinc-500">
                Modern shopping for every need.
              </p>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-6 text-zinc-600">
            Shop top brands, explore curated collections, and enjoy fast
            delivery with excellent support.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
            <a href="#" className="transition hover:text-zinc-900">
              Instagram
            </a>
            <a href="#" className="transition hover:text-zinc-900">
              Twitter
            </a>
            <a href="#" className="transition hover:text-zinc-900">
              Facebook
            </a>
          </div>
        </div>

        {footerLinks.map((group) => (
          <div key={group.title} className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-900">
              {group.title}
            </p>
            <div className="space-y-2 text-sm text-zinc-600">
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block transition hover:text-zinc-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-7xl px-4 text-center text-sm text-zinc-500 sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} E-Commerce Store. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
