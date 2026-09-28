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
  - Checkout is now a real authenticated order flow backed by Stripe Checkout; shipping and tax remain intentionally free/not configured.
  - Avoid calling `setState` synchronously inside `useEffect` to restore cart
    state — the React compiler flags it (cascading renders). Derive from the
    store instead.
  - Referencing a store value that depends on `product?.id` inside the selector
    is fine; the selector re-evaluates when `product` resolves and the store
    changes.

- Next steps suggestions:
  - Cap quantity at `product.stock` when adding and while incrementing in the
    cart page.
  - When checkout/orders are implemented server-side, sync `cart-storage` with
    the API after login.

## Order and Stripe Checkout System (2026-09-14)

- The cart checkout flow calls POST /orders and redirects to the Stripe Checkout URL returned by the server.
- The payment status page displays persisted order state and supports retrying unpaid payments.
- stripe.ts uses window.location.assign(result.url) because the installed Stripe.js version no longer exposes redirectToCheckout.
- Client configuration includes NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; server configuration includes STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and CLIENT_BASE_URL.
- Client prices are display-only; the server reloads products and stores a price/name/shop snapshot before creating the Stripe session.

## My Orders — order history pages (2026-09-25)

Added a "My Orders" area so a signed-in user can see every product they
ordered, with per-item details and live payment status.

### Routes

| Route               | Rendering | Purpose                                     |
| ------------------- | --------- | ------------------------------------------- |
| `/user/orders`      | static    | Order history list + status filter + paging |
| `/user/orders/[id]` | dynamic   | Full order breakdown for one order          |

Both are wrapped in `ProtectedRoute` (Clerk), and "My Orders" was added to
`Navbar.signedInNavLinks`.

### Files added

**Presentation — `client/util/order.ts` (NEW, the important one)**

Single source of truth for order presentation. Everything else imports from
here, so a status can never look different on two screens:

- `ORDER_STATUS_META` / `getOrderStatusMeta()` — per-status label, icon, title,
  description and the tailwind classes for the badge and the full panel.
  **Never throws** on an unknown status; falls back to PENDING.
- `canRetryPayment(status)` — true for `PENDING` / `PAYMENT_FAILED`. Mirrors
  the guard in `OrdersService.retryPayment`; keep the two in sync.
- `getAssetUrl(url)` — resolves a relative asset path against
  `NEXT_PUBLIC_ASSET_API`. Centralised because every other component in the app
  inlines this `startsWith("http")` ternary; order surfaces must not.
- `getItemCount`, `getTotalQuantity`, `getPreviewImage` — client-side
  equivalents of the server-derived fields, used only as a fallback for
  `GET /orders/:id` (the single-order response has no summary fields).
- `formatOrderId(id)` → `#A1B2C3D4`, `formatOrderDate(iso)` (guards invalid
  and missing timestamps).

**Components — `client/app/components/`**

- `OrderStatusBadge.tsx` — status pill, `size="sm" | "md"`. Renders from
  `ORDER_STATUS_META`; take the classes from there, do not re-derive them.
- `OrderItemRow.tsx` — one purchased product (image, name, seller, unit price,
  qty, line total). `linkToProduct={false}` disables the links.
- `OrderCard.tsx` — summary row for the history list. Wrapped in **`memo`**;
  keep it that way, pagination re-renders the whole list.
- `OrderStatusFilterTabs.tsx` — ALL / PENDING / PAID / PAYMENT_FAILED /
  CANCELLED tabs. Optional `counts` prop renders a per-status badge.
- `OrderDetailView.tsx` — header + status + items + totals, with an optional
  `action` slot. Reused by `/user/orders/[id]`; the layout and the totals
  block live here, not in the page.

**Pages**

- `client/app/user/orders/page.tsx` — list. Owns `page` + `status` state and
  calls `useOrders(page, status)`. Changing the filter resets to page 1.
- `client/app/user/orders/[id]/page.tsx` — thin server component; awaits
  `params` and renders `OrderDetail`.
- `client/app/user/orders/[id]/OrderDetail.tsx` — client component with the
  `useOrder` query, not-found state, and the retry-payment button. Split out
  from `page.tsx` because the route file must stay a server component to
  receive the `id` param (same pattern as `ProductDetails`).

### Data layer

- `types/order.ts` — added `OrderSummary`, `OrderListItem` (`Order` +
  summary), `OrderListResponse` (the `PaginatedResult` envelope) and
  `OrderStatusFilter`. These mirror the server response; the two are kept in
  sync by hand — there is no shared codegen.
- `lib/order/api.ts` — `listOrders` now takes `{ page, limit, status }` and
  returns `OrderListResponse`. It builds a `URLSearchParams` and **omits
  `status` when it is `"ALL"`** so the server doesn't add a redundant filter.
  Removed a stray `console.log`.
- `lib/order/queries.ts` — `useOrders(page = 1, status = "ALL")` with
  `placeholderData: previousData` so paginating doesn't blank the list.
  Query keys are now factory-shaped (`orderKeys.list(page, status)`,
  `orderKeys.lists()`) — **always invalidate `orderKeys.lists()`** for
  list-wide changes, since the old `orderKeys.all` no longer matches the
  paginated keys. `useRetryPayment` now invalidates both the detail and the
  lists, because a retry resets the order to PENDING and changes its row.

### Refactor: payment status page

`app/payment/status/page.tsx` previously had its own `STATUS_META` map and its
own inline order-item markup. Both are deleted in favour of the shared
`getOrderStatusMeta()` and `OrderItemRow`, so the payment page and the order
detail page can't drift apart. It also gained a "View full order" link to
`/user/orders/{id}`.

### Gotchas for the next agent

- **`getOrderStatusMeta` is the only place status copy/colour lives.** If you
  add a status to `types/order.ts` you must add it to `ORDER_STATUS_META`
  (TypeScript will not catch a missing entry — the `Record` type will).
- `GET /orders` returns summary fields but `GET /orders/:id` does not, so
  `OrderCard` uses `order.itemCount ?? order.items?.length ?? 0` style
  fallbacks. Keep those fallbacks if the detail endpoint later gains summaries.
- Changing the status filter must reset `page` to 1, otherwise you can land on
  a page that does not exist for the new result set. This is handled in
  `handleStatusChange` — preserve it.
- `isFetching` (not `isLoading`) is used to dim the list during page changes;
  `placeholderData` keeps the old page on screen, so `isLoading` would never
  re-true.
- The server hard-caps `limit` at 50, so no client-side page size needs to
  guard against absurd values.
- **The server bug this page works around:** `GET /orders` was returning `[]`
  because the controller passed the Clerk id where the internal `users.id` UUID
  was expected. Fixed server-side. If the list is ever empty for a user who
  definitely has orders, check that the controller still passes `user.id` and
  not `user.userId`.

### Verification performed

- `npx tsc --noEmit` clean; `npx eslint` clean on all touched files.
- `npm run build` succeeds; `/user/orders` prerenders static and
  `/user/orders/[id]` is a dynamic segment.
- Server logic verified against the real database: pagination
  (`page=2&limit=2` → `totalPages: 3`), `limit` clamping, `status` filtering
  (3 PAID of 6), derived summaries, and cross-user isolation (another user
  sees 0 orders; a foreign `getOrder` returns null → 404).

### Next steps

- Add a cancel/refund action for `PENDING` orders.
- Status counts in the filter tabs are supported by the component (`counts`
  prop) but not yet returned by the API — a `GROUP BY status` endpoint would
  be the natural next addition.
- Consider a dedicated "track shipment" status; the `OrderStatus` enum would
  need extending on both sides.

## Seller Shop Orders and Fulfilment (2026-09-27)

The seller-facing workflow is intentionally separate from buyer `/user/orders`:
buyer `OrderStatus` describes Stripe payment, while `DeliveryStatus` describes
seller fulfilment after payment succeeds. Keep the two types, metadata maps,
badges, and query-key namespaces separate.

### Routes and user flow

| Route                                    | Purpose                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `/user/shop-orders`                      | Paginated paid seller inbox; optional `?shopId=` scopes it.                           |
| `/user/shop-orders/[orderId]?shopId=...` | Seller detail for one order/shop pair, with whole-order and per-line status controls. |
| `/user/user-shop`                        | My Shop dashboard; shows an aggregate new-paid badge and per-shop badges.             |

Navbar links to Shop orders and My Shop. The owned shop's public `ShopInfoCard`
links directly to its filtered seller-order inbox. `ShopCard` accepts optional
`newOrderCount`; only My Shop supplies this prop.

### Status and badge contract

- `types/order.ts` mirrors server `DeliveryStatus` and `(order, shop)` response
  types. `util/delivery.ts` is the one source for delivery-stage labels, icons,
  colours, filter labels, and the next stage. Payment styling remains in
  `util/order.ts`.
- A `PENDING` delivery status is labelled **Pending**, not **New**. The
  `NewOrdersBadge` exclusively means paid orders not yet actioned.
- Server `acknowledgedAt` is set on the first status action on any line for a
  given shop/order pair and is sticky. `ShopOrder.isNew` and `newPaid` mirror
  that contract. A status change must invalidate seller lists, detail,
  aggregate summary, and per-shop summary map via `shopOrderKeys`.
- Per-shop card badges count each paid order for that shop. The My Shop header
  uses the all-owned-shops summary so a basket that contains products from two
  owned shops counts once globally, not twice.

### Client architecture

- `lib/shop-orders/api.ts` owns `/shop-orders` API calls. `listShopOrders`
  serializes `deliveryStatus` (not buyer `status`) and sends `newOnly=true` only
  when enabled.
- `lib/shop-orders/queries.ts` owns seller-only query keys, hooks, and status
  mutation invalidation. Do not reuse buyer `orderKeys`.
- `ShopOrderCard` is memoized and shows only this shop's subtotal/items.
  `ShopOrderDetailView` and `ShopOrderDetail` support both bulk stage updates
  and per-line updates for split fulfilment.
- The server route `page.tsx` reads `searchParams` and passes `shopId` to
  `ShopOrdersClient`. Keep it a Server Component: Next.js 16's installed guide
  notes that a client `useSearchParams()` can force client rendering up to
  Suspense and can fail a prerendered build when no boundary exists. Route
  `searchParams` values can be strings or arrays; narrow before passing the
  shop id.
- Changing shop, delivery status, or the new-only toggle resets pagination to
  page 1. Keep `newOnly` in both the list query key and API arguments.

### Verification and server maintenance

- `cd client && npx tsc --noEmit`
- `cd client && npm run build` (checks prerendering and seller routes)
- `cd server && npm run build`
- `cd server && npm run orders:backfill-shop-items` (requires configured DB;
  idempotently backfills old orders, then checks pair pagination, new-only,
  summary map, first-action badge behavior using a rolled-back transaction,
  and ownership isolation).
- Server uses TypeORM `synchronize: true`; do not add a public backfill route.
  See `server/AGENTS.md` for endpoint contracts, query details, and the
  PostgreSQL `"order"` reserved-word caveat.

## Buyer Profile and Delivery Addresses (2026-09-27)

- `/user/profile` edits the signed-in user's primary `address` and `phone` via
  `PATCH /users/me`. The server resolves the account from `@CurrentUser()`;
  never send or trust a client-supplied user id.
- Cart checkout loads the profile and defaults to its saved address. The buyer
  may override the address for this checkout only; this value is sent as
  `deliveryAddress` in `POST /orders` and does not update the profile.
- New checkout requires both a primary phone and an address. The server
  snapshots the selected address and profile phone on the order. Seller-facing
  shop-order responses expose those order snapshots, not the buyer's current
  profile values.
- Buyer order list/detail show the order's aggregated delivery status. The
  status is distinct from payment `OrderStatus`; use `DeliveryStatusBadge`
  and `util/delivery.ts` for presentation.
- Buyers can confirm receipt from order detail once every non-cancelled item
  has shipped. Confirmation marks every non-cancelled line `DELIVERED` and sets
  the order-level sticky `buyerConfirmedAt` timestamp; cancelled lines stay
  cancelled. Sellers see the timestamp and delivered status in their order
  views. Invalidate buyer order list/detail data after confirmation.
- Buyer address edits use `PATCH /orders/:id/delivery-address`. The server
  rejects edits once any line is `SHIPPED` or `DELIVERED`; the order detail
  response includes `deliveryAddressEditable` to drive the UI. Keep the server
  guard even if the client hides the edit control.
- Updating an order address changes only that order snapshot. It must never
  mutate `users.address` or `users.phone`. Existing historical orders can have
  null delivery fields because this feature does not rewrite old orders.
- Types and hooks live in `types/order.ts`, `lib/order/`, and `lib/user/`.
  Invalidate buyer order list/detail cache when adding more order mutations.

## Navbar Account Menu (2026-09-27)

- Keep Profile, My Orders, Shop orders, and My Shop inside Clerk's
  `UserButton.MenuItems` using `UserButton.Link` children with `labelIcon`.
  The installed Clerk version supports this API; keep the `UserButton` in the
  shared header on both desktop and mobile.
- Do not repeat account destinations as top-level navbar links or mobile-drawer
  rows. Keep general shopping navigation and the cart outside the account
  menu.

## Verified Product Reviews

- Buyers can review each delivered order item only after confirming receipt.
  The order detail review form is backed by `useOrderReviews` and writes via
  `PUT /orders/:orderId/reviews/:orderItemId`; a buyer may edit that same
  purchase review, but cannot create duplicate reviews for it.
- Product pages fetch public reviews from `GET /products/:productId/reviews`
  with pagination. Show the product aggregate from `Product.rating` and
  `Product.reviewCount`; do not use placeholder review counts or ratings.
- Shared client review contracts live in `types/review.ts`, APIs and query
  invalidation in `lib/product/`, and the order/product presentation in
  `OrderReviewSection`, `ProductReviewsSection`, and `StarRating`.
