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

## Cart System — persistent add-to-cart (2026-09-13)

- Summary: Added a persistent client-side cart. Products added from the product
  details page are stored in localStorage via Zustand `persist`, so data survives
  page refreshes. The Navbar cart button shows the number of **distinct products**
  in the cart (not total quantity) — e.g. adding 2 of the same item shows
  "1", adding 1 each of two different items shows "2".

- Files added/modified:
  - `client/stores/cartStore.ts` (NEW) — Zustand cart store with `persist`
    middleware (storage key: `cart-storage`).
    - Types:
      - `CartProduct = { id, name, price, imageUrl?, stock, shopId?, shopName? }`
        — a snapshot of product data + shop name stored IN the cart so the cart
        page can render full details with no extra API calls.
      - `CartItem = { product: CartProduct; quantity: number }`.
    - Actions: `addItem(product, quantity)` (merges quantity if product already
      in cart and refreshes the product snapshot), `removeItem`,
      `updateQuantity` (removes item when qty <= 0), `clearCart`,
      `getItemQuantity(productId)`.
    - `getTotalItems()` returns `items.length` — the count of distinct products,
      not the sum of quantities.
    - `getSubtotal()` returns `price × quantity` summed across all items.
    - persist config uses `version: 1` + `migrate` to convert the OLD persisted
      shape `{ productId, quantity }` into the new
      `{ product: CartProduct, quantity }` shape (old items get blank product
      data). Bump `version` and extend `migrate` whenever the item shape
      changes.
    - Follows the same `persist` pattern as `stores/userStore.ts`.
  - `client/app/cart/page.tsx` (NEW) — Responsive cart page at `/cart`:
    - Empty state: friendly card with icon + "Start Shopping" link to `/shop`.
    - Item list: image (links to product), name, "Sold by {shopName}" (from the
      stored snapshot), price, inline quantity +/- controls, remove button.
      Quantities can't go below 1 via the button (clicking − when qty=1
      removes the item and shows a toast).
    - "Clear cart" button in the header with confirmation toast.
    - Sticky order summary sidebar (subtotal, free shipping, total) on
      `lg:` screens; stacks below list on mobile. Grid:
      `lg:grid-cols-[minmax(0,1fr)_360px]`.
    - Responsive item row: `flex-col` on mobile (large image on top),
      `sm:flex-row` on larger screens.
  - `client/app/components/Navbar.tsx` — Cart link now points to `/cart` (both
    desktop and mobile menu). `const cartCount = useCartStore((s) =>
s.items.length)`. Desktop shows a badge (absolute positioned amber pill),
    mobile menu shows an inline badge. Badges only render when `cartCount > 0`.
  - `client/app/components/ProductDetails.tsx` — Add-to-cart handler now calls
    `addItemToCart({ id, name, price, imageUrl: product.imageUrl?.[0], stock,
shopId, shopName }, quantity)`; `toast.success` confirms. The "Added to
    cart" state is DERIVED from the persisted store (subscription to the item
    quantity for `product?.id`) instead of local `useState`, so it survives
    refresh and stays in sync without effects.
  - `client/app/cart/page.tsx` — Checkout button is now auth-aware via Clerk
    `useAuth()`:
    - Signed in → renders a plain "Checkout" button.
    - Signed out → renders `<SignInButton mode="modal">` with a "Login to
      checkout" label. Clicking opens Clerk's sign-in modal (same component
      used in `Navbar.tsx`); mode="modal" keeps the user on `/cart` after
      signing in (no redirect to a separate sign-in page).

- Implementation notes / gotchas:
  - IMPORTANT: When reading a persisted store value, subscribe to the derived
    VALUE (e.g. `state.items.find(i => i.product.id === product?.id)?.quantity`)
    — NOT to a helper function reference like `getItemQuantity`, or components
    won't re-render on cart changes.
  - IMPORTANT: The cart item shape CHANGED from `{ productId, quantity }` to
    `{ product: { id, name, price, imageUrl, stock, shopId, shopName },
quantity }`. Existing localStorage data is migrated by `persist.migrate`
    (version 1). Any code touching `item.productId` MUST be updated to
    `item.product.id`. The only remaining `item.productId` is inside the
    migrate function itself.
  - Cart count in Navbar uses `items.length` (distinct products), NOT
    `reduce(sum, item => sum + item.quantity)`. If you later need total
    quantity for a checkout summary, use `getSubtotal` or calculate inline
    with a reduce on `items`.
  - Auth state comes from Clerk's `useAuth()` hook (`isSignedIn`). Uses
    `<SignInButton mode="modal">` to open the sign-in modal inline — reuse this
    pattern for any other "login to continue" CTA instead of manually
    redirecting to `/sign-in`.
  - The checkout button and shipping/tax logic on the cart page are UI-only
    placeholders — wire them to a real checkout/order flow when the backend
    exists.
  - Avoid calling `setState` synchronously inside `useEffect` to restore cart
    state — the React compiler flags it (cascading renders). Derive from the
    store instead.
  - Referencing a store value that depends on `product?.id` inside the selector
    is fine; the selector re-evaluates when `product` resolves and the store
    changes.

- Next steps suggestions:
  - Wire the "Checkout" button to a real checkout/order flow (backend).
  - Cap quantity at `product.stock` when adding and while incrementing in the
    cart page.
  - When checkout/orders are implemented server-side, sync `cart-storage` with
    the API after login.
