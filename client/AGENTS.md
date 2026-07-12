<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Worklog — Recent Changes (2026-07-12)

- Summary: Added a responsive hero carousel and a reusable shops UI (cards + slider), wired into the home page.

- Files added/modified:
  - `client/app/components/HeroCarousel.tsx` — Hero carousel component (autoplay, controls, indicators).
  - `client/app/components/ShopCard.tsx` — Reusable shop card component (image, name, location, category, rating). Clickable, links to shop detail route.
  - `client/app/components/ShopsList.tsx` — Responsive horizontal slider that renders 10 dummy shops using `ShopCard`. Supports swipe on mobile and arrows on larger screens.
  - `client/app/shop/[id]/page.tsx` — Dynamic placeholder page for individual shops (route receives `id`).
  - `client/app/page.tsx` — Updated to import and render `HeroCarousel` and `ShopsList`.

- Implementation notes:
  - `HeroCarousel` is a client component (`"use client"`) and uses `useEffect` + `setInterval` to auto-advance slides every 5s. Controls call a local `goToSlide` setter.
  - `ShopCard` is a small presentational component. It expects props: `id, image, name, location, category, rating` and links to `/shop/{id}`.
  - `ShopsList` currently uses 10 dummy shops (array generated locally). It renders a horizontally scrollable list with `snap-start` and `min-w-*` sizing so cards don't overlap. Arrow buttons scroll by ~80% of the container width.

- How to replace dummy data with your API:
  1.  Replace the `shops` array in `ShopsList.tsx` with a data fetch (server or client). Example fetch (client):

```ts
useEffect(() => {
  fetch("/api/shops")
    .then((r) => r.json())
    .then(setShops);
}, []);
```

    2. Or lift data fetching to a parent page and pass `shops` into `<ShopsList shops={shops} />` (preferred for SSR).

- Notes on responsiveness & accessibility:
  - Cards are responsive via `min-w-*` breakpoints: mobile shows one card-width, tablet two, desktop more.
  - Slider uses `overflow-x-auto` and `scroll-snap-type: x mandatory` so keyboard and touch behave predictably.
  - Buttons include `aria-label` attributes. Consider adding keyboard focus styles and skip links if needed.

- Quick dev commands (client):

```bash
cd client
npm run dev
```

- Remaining TODOs / suggestions:
  - Replace dummy images with production images or an image CDN.
  - Integrate real API and handle loading / error states in `ShopsList`.
  - Add unit / storybook stories for `ShopCard` and `HeroCarousel`.
  - Add tests for the slider scrolling behavior if required.

## Change-tracking

- Last update: 2026-07-12 — Components and routes added; home page updated.
- Verified: Editor shows no TypeScript/compile errors for the edited files at time of change.

If you want, I can add API wiring now or create tests/stories — tell me which next.

## Categories UI (2026-07-12)

- Summary: Added responsive categories grid and tile component.

- Files added:
  - `client/app/components/CategoryCard.tsx` — Simple category tile with image and name, links to `/category/{id}`.
  - `client/app/components/CategoriesList.tsx` — Responsive grid (2–4 columns depending on screen width) with sample categories.
  - `client/app/page.tsx` — Now renders `CategoriesList` under `ShopsList`.

- Implementation notes:
  - `CategoriesList` uses a small array of sample categories with Unsplash images and renders them in a responsive CSS grid.
  - `CategoryCard` is intentionally minimal and clickable; replace the image URLs with production assets as needed.

- Next steps suggestions:
  - Add a dynamic category page at `client/app/category/[id]/page.tsx` and route to show category-specific products/shops.
  - Fetch categories from an API and handle loading / error states.

## Products UI (2026-07-12)

- Summary: Added `ProductCard` (with internal image carousel) and `ProductsList` to display popular products.

- Files added:
  - `client/app/components/ProductCard.tsx` — Product card with image carousel, name, shop, rating, and sold count. Clickable to product page.
  - `client/app/components/ProductsList.tsx` — Responsive product grid (1–4 columns depending on screen width) rendering sample products.
  - `client/app/product/[id]/page.tsx` — Dynamic placeholder product details page (receives `id`).
  - `client/app/page.tsx` — Now renders `ProductsList` after `CategoriesList`.

- Implementation notes:
  - `ProductCard` uses a small local carousel (manual prev/next) and shows image indicators. It links to `/product/{id}`.
  - `ProductsList` contains sample product objects with two placeholder images each. Replace images/data with real API data when ready.

- Next steps suggestions:
  - Replace sample product images and data with API responses; implement server-side fetching for SEO.
  - Build a full product detail page with image gallery, price, variants, and add-to-cart flow.
