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

| Route                                    | Purpose                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `/user/shop-orders`                      | Paginated paid seller inbox; optional `?shopId=` scopes it.               |
| `/user/shop-orders/[orderId]?shopId=...` | Seller detail for one order/shop pair; products behind an expand.         |
| `/user/user-shop`                        | My Shop dashboard; shows an aggregate new-paid badge and per-shop badges. |

Navbar links to Shop orders and My Shop. The owned shop's public `ShopInfoCard`
links directly to its filtered seller-order inbox. `ShopCard` accepts optional
`newOrderCount`; only My Shop supplies this prop.

### One order = one card, one status (2026-10-02)

A seller thinks in orders — "ship this", "mark it delivered" — so the order is
the row and the products are detail revealed on demand. A row per product made
a two-product order look like two competing obligations, each apparently needing
its own status update.

- `ShopOrderProducts` is the shared expand/collapse panel. Both `ShopOrderCard`
  (list) and `ShopOrderDetailView` (detail) render it, so the behaviour is
  identical on both screens. Reuse it; do not hand-roll a second product list.
- It takes `items`, `shopName`, `totalQuantity`, `defaultExpanded`. It renders
  NO status control or badge per product — that is deliberate, not an omission.
- `ShopOrderCard` is `memo`ised and its products are collapsed by default, so a
  10-row page does not mount 10 product lists on first paint.
- One `DeliveryStatusSelect` per order, wired to `useUpdateOrderDeliveryStatus`.
- `useUpdateItemDeliveryStatus`, `updateItemDeliveryStatus` and the per-item
  `deliveryStatus` on `ShopOrderItem` were **removed** along with the server
  endpoint. Do not reintroduce a per-product status control without changing
  the API first — the client cannot express a state the server no longer has.
- `ShopOrderItemRow` moved into the new component and is no longer exported from
  `ShopOrderDetailView`; the buyer-facing `OrderItemRow` is unrelated and still
  used by `OrderCard`.

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
- `ShopOrderCard` is memoized and shows only this shop's subtotal/items. It
  renders `ShopOrderProducts` for the product list. `ShopOrderDetailView` and
  `ShopOrderDetail` update the whole order in one action; there is no per-line
  status control anywhere in the seller UI.
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
  with pagination. Product APIs derive `rating` and `reviewCount` from review
  rows, repairing stale stored aggregates; do not use placeholder values or
  substitute a shop rating.
- Product cards must show the product's own rating/count, not its shop's rating.
  `soldCount` is the paid, non-cancelled quantity returned by product APIs; do
  not hardcode sales numbers. Shop cards do not show shop-review stars.
- Product detail summary shares page-one product reviews with the review list
  and derives an average from them when the full set fits on that page; larger
  sets use the product API's aggregate average.
- Seller shop-order items include an optional `review` with the verified
  buyer's rating and message. Show it only within that shop's order details.
- Review mutations invalidate product details, popular products, shop product
  pages, and the product review list so updated aggregates appear everywhere.
- Shared client review contracts live in `types/review.ts`, APIs and query
  invalidation in `lib/product/`, and the order/product presentation in
  `OrderReviewSection`, `ProductReviewsSection`, and `StarRating`.

## Shop Catalog — Search, Filter, Sort, Pagination (2026-09-29)

`app/shop/page.tsx` had a fully styled search box, category `<select>`, and sort
`<select>` that were never wired to anything, plus a `currentPage` state that
was reset on every navigation. The page also carried a large hardcoded `shops`
array and a local `Shop` type that did not match the API's `Shop`.

All of that is now removed. Filtering, sorting, and paging are resolved by
`GET /shop` on the server; the page is a thin client over that endpoint.

### Files

- `app/components/ShopFilters.tsx` — **new**. Presentational search + category +
  sort controls. Owns no state; every value is a prop with a matching callback.
- `app/shop/page.tsx` — rewritten. State, debounce, handlers, and rendering.
- `lib/shop/queries.ts` — `useShops` now takes `FetchShopsParams`; added
  `useShopCategories` backed by `getCategories()`.
- `lib/shop/api.ts` — `getShops(params)` builds a `URLSearchParams` query.
- `types/shop.ts` — added `ShopSortOption` and `FetchShopsParams`;
  `FetchShopsResponse` now carries `total` and `totalPages`.
- `app/components/Pagination.tsx` — windowed page list (see below).

### API contract

`GET /shop?page=1&search=cafe&categoryId=<uuid>&sortBy=newest` returns
`{ data: Shop[]; page: number; total: number; totalPages: number }`.

`getShops` omits empty params entirely, so "no filter" is a clean `/shop` call.
Page size is 15, fixed server-side.

### State and handler conventions

- `search` is the **live** input value; `debouncedSearch` (400ms) is what
  actually reaches the API. Keep both — binding the query key straight to the
  input would fire a request per keystroke.
- Every filter change resets `currentPage` to `1` **in the change handler**
  (`handleSearchChange`, `handleCategoryChange`, `handleSortChange`), _not_ in
  a `useEffect`. An effect would trigger a second render pass for a value we
  already know synchronously, and `react-hooks/set-state-in-effect` is a lint
  error in this repo.
- If a filter shrinks the result set below the current page, the page clamps
  itself during render (`if (currentPage > totalPages) setCurrentPage(...)`).
  This is React's documented adjust-during-render pattern; an effect would flash
  an empty list first. Do not "fix" it by moving it into `useEffect`.
- `handleClearFilters` clears `debouncedSearch` directly as well as `search`,
  so the reset is immediate instead of waiting out the debounce.

### Categories come from the API

The category dropdown is populated by `useShopCategories()` → `GET /category`,
**not** a hardcoded list. The previous `categoryOptions` array held names
("Home", "Outdoor", …) with no corresponding database rows, so selecting one
would have sent a name where the endpoint expects a `categories.id` UUID and
silently returned everything. The dropdown uses a sentinel `__all__` internally
and converts it to `""` before calling back, so `categoryId === ""`
consistently means "all categories".

### Shared `Pagination` component

`app/components/Pagination.tsx` previously rendered one button per page. With a
15-item page size that meant hundreds of buttons on a large catalog. It now uses
`buildPageList`, which always shows the first page, last page, current page, and
its immediate neighbours, with `…` markers for elided ranges. Lists of 7 or
fewer pages render in full with no gaps.

This component is shared with `app/user/orders/page.tsx` and the shop-orders
pages, so the windowing change improves all of them. It remains a controlled
component (`page`, `totalPages`, `onPage`), and callers remain responsible for
hiding it when `totalPages <= 1`, matching the orders-page pattern.

## Seller Dashboard (2026-09-30)

A shop owner opens `/user/dashboard` to see total earnings, total sales, total
shops and total products, plus a day/month sales chart and range filters.

### Files added

- `app/user/dashboard/page.tsx` — thin server component (mirrors the
  `ShopOrdersPage` / `ShopOrdersClient` split).
- `app/user/dashboard/DashboardClient.tsx` — all client state and composition.
- `app/components/dashboard/StatCard.tsx` — one KPI tile. Presentational and
  dependency-free: takes a value, label, optional trend and icon node.
- `app/components/dashboard/StatCardGrid.tsx` — responsive 1/2/4-column grid.
- `app/components/dashboard/DashboardCard.tsx` — titled panel used by every block.
- `app/components/dashboard/DashboardSection.tsx` — titled section wrapper with an
  `action` slot; used for the portfolio / selected-shop split.
- `app/components/dashboard/ShopSelector.tsx` — native `<select>` shop picker.
- `app/components/dashboard/AnalyticsFilterBar.tsx` — range presets + metric toggle.
- `app/components/dashboard/SalesChart.tsx` — Recharts line/bar chart.
- `app/components/dashboard/TopProductsTable.tsx` — best sellers with share bars.
- `lib/analytics/api.ts`, `lib/analytics/queries.ts` — fetch + React Query hook.
- `types/analytics.ts` — hand-maintained mirror of the server contract.
- `util/analytics.ts` — range presets, currency/date formatting, `percentageChange`.

### Files modified

- `app/components/Navbar.tsx` — added a **Dashboard** entry to the Clerk
  `UserButton` menu, gated on owning a shop.
- `package.json` — added `recharts@^3.10.1`.

### Conventions to preserve

- **The Navbar gate is a declarative `requiresShop` flag**, not an inline
  `link.label === "Shop orders"` comparison. The old inline check meant a new
  seller link could silently ship un-gated and be shown to buyers. Both "Shop
  orders" and "Dashboard" now carry `requiresShop: true`.
- **The reporting window must be part of the React Query key**, not just the
  granularity. `7d`/`30d`/`90d` all use `granularity: "day"`, so keying on
  granularity alone serves one window's data for another and switching between
  them does not refetch. `analyticsKeys.detail(shopId, granularity, range)`
  includes `range.from ?? "all"` and `range.to`.
- **"All time" is expressed by OMITTING `from`**, not by sending a large day
  count. The server then starts the window at the shop's own `createdAt`, which
  is the only place that knows when selling began. `AnalyticsRangePreset.days`
  is optional for exactly this reason.
- **Pin "today" once per mount** (`useState(() => new Date())`). Resolving it
  per render would produce a new query key at midnight and silently refetch.
- **Compare each metric against itself.** `compare(current, previousValue)`
  takes the previous value explicitly; do not collapse it to a single helper
  that hardcodes one field, or units-sold ends up diffed against a dollar figure.
- **Money is formatted with `formatCurrency` (2dp), not `formatPrice`.**
  `formatPrice` in `util/functions.ts` rounds to whole units for the catalogue;
  using it here would render a $0.50 sale as "$1".
- **`SalesChart` is a `"use client"` component** because `ResponsiveContainer`
  measures the DOM via `ResizeObserver`. `initialDimension` is passed so SSR
  does not render a zero-height chart.
- **Recharts 3 API:** tick formatting is `tickFormatter` on `<YAxis>`.
  `tick={{ formatter }}` was Recharts 2 and no longer type-checks.
- Only the non-active series is faded/hidden; the second `YAxis` is unmounted
  rather than hidden so it never reserves width and squeezes the plot.
- `percentageChange` returns `null` for a zero baseline and `StatCard` renders
  that as "No comparison". Do not substitute 0 — a fabricated +100% is worse
  than an honest blank.

### Gotchas hit while building this

- **Import depth from `app/user/dashboard/`**: `app/components/*` is
  `../../components/...`, but `lib/`, `types/` and `util/` are `../../../`.
  Using `../../../components/...` resolves to a non-existent `client/components/`
  and fails with `TS2307`.
- Recharts in a Server Component fails the build. Keep the chart in its own
  `"use client"` file; the page and `DashboardClient` boundary is fine.

## Dashboard: Portfolio vs. Per-Shop Split (2026-09-30, round 2)

The dashboard is now **two independent sections**, because the data behind them
changes on completely different triggers.

| Section   | Query                   | Changes when            | Changes when     |
| --------- | ----------------------- | ----------------------- | ---------------- |
| All shops | `useShopPortfolio()`    | shop/product created    | **nothing else** |
| This shop | `useShopAnalytics(...)` | shop selected, range or | —                |
|           |                         | metric changed          |                  |

### Files changed

- `types/analytics.ts` — **removed** `portfolio` from `ShopAnalytics`; added
  `ShopPortfolio` (`totalShops`, `totalProducts`, `totalRevenue`,
  `totalUnitsSold`, `totalOrders`, `currency`).
- `lib/analytics/api.ts` — added `getShopPortfolio()` → `/shop/analytics/portfolio`.
- `lib/analytics/queries.ts` — added `portfolioKeys` and `useShopPortfolio()`.
- `app/components/dashboard/DashboardSection.tsx` (NEW) — titled section
  wrapper with an `action` slot for the shop picker.
- `app/user/dashboard/DashboardClient.tsx` — one `stats` array split into
  `portfolioStats` and `shopStats`; header no longer hosts the shop selector.
- `lib/shop/mutation.ts`, `lib/product/mutation.ts` — invalidate `portfolioKeys`
  (and `analyticsKeys`) on create/delete.

### Rules to preserve

- **Portfolio lives under its own query key, never under `analyticsKeys`.** It
  is not shop-scoped and not range-scoped, so keying it under the per-shop key
  would both be wrong and would create one identical cache entry per shop.
- **`useShopPortfolio` has no arguments.** This is the mechanism, not a
  simplification — the hook cannot re-run on a shop switch because nothing in
  its key or its inputs can change.
- **`staleTime` is 5 minutes, deliberately above the global 60s.** These totals
  only move when a shop or product is created or deleted — never on a sale. A
  sale invalidating this query would reintroduce the exact bug this split fixed.
  The compensating cost is that structural writes _must_ invalidate it
  explicitly; that is the job of `useCreateShop` / `useDeleteShop` /
  `useAddProductToShop` / `useDeleteProduct`. **If you add a mutation that
  changes a shop or product count, add the invalidation there too** — nothing
  else will refresh the tile.
- **`portfolioStats` and `shopStats` are separate `useMemo`s with separate
  dependency lists.** Collapsing them back into one array is what caused the
  original problem: a single `stats` array re-derived whenever the shop query
  changed, even though half its contents were unrelated to that query.
- **Portfolio tiles carry no trend column.** A period-over-period percentage is
  meaningless against lifetime totals and would imply a window that isn't
  applied. Only the per-shop tiles get `change` / `changeLabel`.
- **The shop selector moved into the "This shop" section header.** It is
  `DashboardSection`'s `action` slot, not the page header. Keeping it there makes
  the control visibly attached to the data it changes, and reinforces that it
  does not affect the section above it.
- **`useCallback` for `compare`.** It is referenced by `shopStats`' dependency
  list; without the memo, its identity changes every render and `shopStats`
  recomputes on every render too, defeating the memo.

## Seller Dashboard Fixes (2026-10-07)

Follow-up to the split above, from the report "my shop shows 14 sold but when
I'm selecting a shop it doesn't show sales or anything".

### `14` was correct — the zero was unexplained

`14` is the **portfolio** total. Per-shop numbers were right all along; 4 of
that owner's 9 shops have never sold anything. The dashboard was not wrong, it
was **silent**, and silence reads as broken. Three disclosure fixes:

- `ShopSelector` takes `salesByShop` and renders `Green Shelf — 9 sold`, so a
  zero-sales shop is visibly a zero **before** it is selected.
- The portfolio payload gained a `shops[]` breakdown (one entry per shop,
  including zeros) so the counts can be shown at all.
- An amber "No sales in this range" panel under the chart, which distinguishes
  "sold before, not in this window" from "never sold", and names the
  paid-only rule so `PENDING` orders stop looking like missing data.

### All four shop tiles are period-scoped now

They used to mix windows in one row: earnings and sales were labelled
**Lifetime** while "Orders in period" beside them was window-scoped, and the
chart below was window-scoped. A shop with lifetime sales but none in range
showed a big number above an empty chart — the exact shape of a bug.

**Rule: within one section every number describes the same window.** Lifetime
figures belong to the portfolio section. Do not reintroduce a lifetime figure
next to a period figure "just for context".

### Auto-selection is derived, not effected

```tsx
const [chosenShopId, setChosenShopId] = useState<string | null>(null);
const selectedShopId = useMemo(() => {
  if (!shops?.length) return undefined;
  if (chosenShopId && shops.some((s) => s.id === chosenShopId))
    return chosenShopId;
  return shops[0].id;
}, [chosenShopId, shops]);
```

This replaces `useEffect(() => setSelectedShopId(shops[0].id), …)`, which cost
an extra render pass per load and tripped `react-hooks/set-state-in-effect`.
Two things make it correct, and both are load-bearing:

- `null` means "no explicit choice", which is what allows the fallback to exist
  without writing it back into state.
- The `shops.some(...)` guard means a choice for a deleted shop falls back
  instead of requesting analytics for an id that 404s.

**The server must return the shop list in a stable order.** It now sends
`ORDER BY createdAt DESC`. Without it `shops[0]` is whatever Postgres
produced, so the dashboard opens on a random shop — most often a zero-sales
one, which is what made this look broken in the first place.

### `useGetUserShop` has a 10-minute `staleTime`

Mounted by **both** `Navbar` and `DashboardClient` against the same
`["userShop"]` key, so at the 60s global default it refetched on nearly every
dashboard visit for a list that only changes when a shop is created or
deleted. Ten minutes makes it effectively session-cached.

Safe because create/delete already `invalidateQueries({ queryKey: ["userShop"] })`
in `app/user/user-shop/page.tsx`. **If you add another path that creates or
deletes a shop, it must invalidate that key** — otherwise the change stays
invisible for ten minutes.

### Rule to preserve

**Measure before optimising.** Every analytics query here was measured at
0.028ms–0.397ms with `EXPLAIN ANALYZE`; the reported "slow API" was request
count, not query time. If a dashboard request feels slow, count the network
requests first and profile the SQL second — the cheap queries are not the
problem, and adding indexes to them buys nothing.

## Cards / Details Split (2026-10-02)

`useShopAnalytics` returned numbers and chart in one blocking payload, so every
KPI tile waited on two grouped scans it did not display. Now two hooks:

| Hook                      | Key suffix                   | Feeds                                     |
| ------------------------- | ---------------------------- | ----------------------------------------- |
| `useShopAnalyticsCards`   | `analyticsKeys.cards(...)`   | the four KPI tiles + the "Lifetime" panel |
| `useShopAnalyticsDetails` | `analyticsKeys.details(...)` | `SalesChart` + `TopProductsTable`         |

Both take the same `(shopId, granularity, range)`, so they always describe the
same window, and they fire concurrently. `useShopAnalytics` no longer exists —
do not reintroduce a combined hook.

### Loading state is per-section, not per-page

```ts
const analytics = cardsQuery.data; // cards own every NUMBER on the page
const isLoading = cardsQuery.isLoading; // used by tiles + lifetime panel
const details = detailsQuery.data; // chart + best sellers only
const isDetailsLoading = detailsQuery.isLoading;
```

The distinction is the whole point of the split. Deriving the chart from
`analytics` (the cards payload) would reintroduce the coupling; deriving the
tiles from `details` would block them again. Each surface reads the query that
owns its data and uses **that** query's loading flag.

### Errors replace content — they never sit above zeros

```tsx
{
  cardsError ? <ErrorCard /> : <>…tiles, chart…</>;
}
```

The dashboard previously read only `data`, so a failed request rendered exactly
like a shop with no sales: zeroed tiles, blank chart. That is the ambiguity
that made a real 403 look like an empty shop. `cardsError` **replaces** the
tiles rather than being displayed above them — every tile value derives from
`cards`, so alongside an error they would all show a `0` that is not a
measurement. A `detailsError` is narrower (the tiles are still valid) and is
reported inline by the chart section.

`readableError()` maps a `403` to "you do not have permission to view this
shop" rather than leaking the raw server message. **Any new dashboard query
must surface its `error`, not just its `data`.**

### Rules to preserve

- **Never gate a number on a chart, or a chart on a number.** If a surface
  needs both, it is two surfaces.
- **`analyticsKeys.all` is a shared prefix** of both `cards` and `details`, so
  `invalidateQueries({ queryKey: analyticsKeys.all })` in
  `lib/product/mutation.ts` still invalidates both. Keep it that way — do not
  give the two halves unrelated roots, or sale-triggered invalidation will
  only ever refresh one of them.
- **Both halves must be fetched for the same range.** They are separate
  requests, not separate concerns; a chart of a different window than its tiles
  is a bug, not a styling choice.
