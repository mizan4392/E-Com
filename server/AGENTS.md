# Products Update API - Agent Documentation

## Endpoint

`PATCH /products/:id`

## Features

- **Multi-file upload**: Supports up to 10 files per request
- **Authorization**: Requires JWT token via AuthGuard
- **Partial updates**: All fields are optional

## Request Format

```
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>
```

### Body Fields

| Field       | Type   | Required | Description          |
| ----------- | ------ | -------- | -------------------- |
| name        | string | No       | Product name         |
| description | string | No       | Product description  |
| category    | string | No       | Product category     |
| price       | number | No       | Product price        |
| stock       | number | No       | Stock quantity       |
| files       | File[] | No       | Up to 10 image files |

## Implementation Files

### Controller: `src/products/products.controller.ts`

- Route: `PATCH /products/:id`
- Guard: `AuthGuard`
- Interceptor: `FilesInterceptor('files', 10)` - handles multiple file uploads

### Service: `src/products/products.service.ts`

- Method: `update(id: string, updateData: UpdateProductData)`
- Logic:
  - Finds product by ID
  - Throws `NotFoundException` if not found
  - Appends new image paths to existing `imageUrl` array
  - Saves updated product

### DTO: `src/products/dto/update-product.dto.ts`

- Uses `class-validator` decorators
- All fields marked as `@IsOptional()`

## Response

Returns updated `Product` entity with all relations.

## Error Cases

- `404 Not Found`: Product with given ID doesn't exist
- `401 Unauthorized`: Missing or invalid JWT token

## Order and Stripe Payment System (2026-09-14)

## Buyer Profile and Delivery Addresses (2026-09-27)

- `users.address` and `users.phone` are the signed-in user's primary delivery
  details. `PATCH /users/me` accepts both fields through `UpdateProfileDto`;
  the controller uses `@CurrentUser()` and never accepts an account id from the
  request body.
- `POST /orders` uses the provided `deliveryAddress` when non-empty, otherwise
  falls back to `user.address`. It requires a non-empty selected address and
  `user.phone`, then snapshots both onto the order's `deliveryAddress` and
  `deliveryPhone` columns. These are order-time values for seller fulfilment;
  later profile changes must not rewrite old orders.
- `PATCH /orders/:id/delivery-address` is owner-scoped using the internal
  `users.id` UUID. It changes only the order's address and returns the same
  buyer detail shape as `GET /orders/:id`.
- `POST /orders/:id/confirm-received` is owner-scoped and requires a paid
  order whose non-cancelled items have all shipped. Confirmation is idempotent
  and atomically marks those items `DELIVERED` while recording the sticky
  `orders.buyerConfirmedAt` timestamp. Cancelled items remain unchanged.
- Product reviews are separate `ProductReview` rows, unique per order item.
  Only the buyer of a paid, receipt-confirmed order may review its delivered
  products; edits reuse the same row. `Product.rating` and `reviewCount` are
  transactionally maintained aggregates; product read APIs also derive the
  returned aggregate from review rows so legacy stale fields cannot hide
  existing reviews. Public review text is served from the paginated endpoint.
- Seller order items expose their own optional review in shop-order responses;
  batch-load these by the paginated order-item ids. Product APIs calculate
  `soldCount` from paid, non-cancelled order-item quantities rather than a
  stored or hardcoded value.
- Product catalog, detail, and shop-product responses carry each product's
  `rating` and `reviewCount`; do not display or substitute a shop rating for a
  product review aggregate.
- Address edits are rejected if any relational `order_items` line is
  `SHIPPED` or `DELIVERED`. The same condition drives the returned
  `deliveryAddressEditable` flag. Keep the server check; client gating is only
  presentation. For multi-shop/split shipments, one shipped line locks the
  whole destination.
- Buyer `deliveryStatus` is aggregated across all order-item rows using
  `aggregateDeliveryStatus` exported from `order-item.entity.ts`; payment
  `Order.status` remains separate. Buyer history performs one batched item
  status query for the current page, not an N+1.
- Seller shop-order payloads include the order's delivery address/phone so the
  owning shop can fulfil it. Do not substitute the buyer's current profile
  contact values for these snapshots.
- TypeORM `synchronize: true` creates the new nullable columns. Existing
  orders intentionally retain null delivery contact; there is no backfill
  because the current profile may no longer match the address used at purchase.
- Client-facing types/hooks are manually mirrored in `client/types/order.ts`,
  `client/lib/order/`, and `client/lib/user/`; keep both sides in sync.

## Order History API — pagination, filtering, summary (2026-09-25)

Reworked the user-facing order history so the client can list a user's orders
with item details and payment status. **Two real bugs were fixed here — read
this before touching order queries.**

### Bugs fixed

1. **`GET /orders` always returned an empty list.** The controller passed
   `user.userId` (the Clerk id, e.g. `user_2abc...`) into a query that filters
   on the `user` relation, which joins on the internal `users.id` UUID. The
   values never match, so the endpoint silently returned `[]`. It now passes
   `user.id`.
2. **`GET /orders/:id` used to leak existence and cost two queries.** It loaded
   the row with `relations: { user: true }` and then compared
   `order.user.id !== userId` in application code, throwing
   `UnauthorizedException`. Ownership is now part of the `WHERE` clause and a
   miss is a `NotFoundException`, so another user's order is indistinguishable
   from a nonexistent one and costs one query instead of two.

> **Rule: the orders module always scopes by the internal `users.id` UUID
> (`user.id`), never the Clerk id (`user.userId`).** The two are different
> columns on different tables. `getOrder`, `listOrders` and `retryPayment` all
> take this internal uuid.

### Endpoints

| Method | Route                              | Notes                                            |
| ------ | ---------------------------------- | ------------------------------------------------ |
| GET    | `/api/orders`                      | Paginated + status filter. Scoped to the caller. |
| GET    | `/api/orders/:id`                  | Single order, owner-scoped. 404 if not yours.    |
| POST   | `/api/orders`                      | Unchanged — creates order + Stripe session.      |
| POST   | `/api/orders/:id/confirm-received` | Buyer confirms receipt after shipment.           |
| POST   | `/api/orders/:id/retry-payment`    | Unchanged.                                       |

`GET /api/orders` query params (validated by `ListOrdersQueryDto`):

- `page` — 1-based, min 1. Default 1.
- `limit` — min 1, **max 50** (hard server cap). Default 10.
- `status` — optional, must be a valid `OrderStatus`. Omit for "all".

Invalid `status` is rejected with a 400 by the global `ValidationPipe`.

### Response shape

`GET /api/orders` now returns a paginated envelope that matches the existing
shop/products endpoints (`PaginatedResult` in `src/common/pagination.ts`):

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "PAID",
      "amountTotal": 49.9,
      "currency": "usd",
      "items": [/* OrderItemSnapshot[] */],
      "createdAt": "2026-09-25T12:00:00.000Z",
      "itemCount": 2, // derived: distinct products
      "totalQuantity": 5, // derived: sum of quantities
      "previewImageUrl": "..." // derived: first usable item image
    }
  ],
  "total": 6,
  "currentPage": 1,
  "totalPages": 1
}
```

The three derived fields (`itemCount`, `totalQuantity`, `previewImageUrl`) are
computed server-side in `OrdersService.toListItem()`. This matters because
`items` is a **JSON column** — Postgres cannot index or aggregate inside it, so
the summary has to be derived in the service. Doing it here keeps the payload
additive and stops every client from re-reducing the same snapshots.

### Files

- `src/orders/dto/list-orders.dto.ts` (NEW) — `ListOrdersQueryDto` with
  `@Type(() => Number)` coercion for `page`/`limit` and `@IsEnum(OrderStatus)`
  for the filter. Requires `transform: true` on the global pipe; it is already
  enabled in `main.ts`.
- `src/orders/orders.service.ts` — rewrote `listOrders` (pagination + filter +
  summary), added the private `toListItem()` mapper, simplified `getOrder`.
- `src/orders/orders.controller.ts` — takes `@Query() ListOrdersQueryDto`,
  passes `user.id`, removed stray `console.log` calls.
- `src/orders/order.entity.ts` — schema change, see below.
- `client/types/order.ts` — mirrors the response as `OrderListItem` /
  `OrderListResponse` (kept in sync manually; there is no shared codegen).

### Entity / schema change (important)

`Order` gained an explicit **`userId` uuid column** with
`@JoinColumn({ name: 'userId' })` on the `user` relation, plus a composite
index:

```ts
@Index('IDX_orders_user_created', ['userId', 'createdAt'])
@Column({ type: 'uuid' }) userId!: string;
```

- The old relation was `onDelete: 'SET NULL'` on a **non-nullable** column,
  which is contradictory. It is now `onDelete: 'CASCADE'` — deleting a user
  removes their orders, which is the correct behaviour for order history.
- **When creating an order you must set `userId` as well as `user`**, because
  the explicit `@JoinColumn` means TypeORM no longer derives the FK from the
  relation. See `createOrder()` in the service.
- The project runs TypeORM with `synchronize: true`, so the column, the index
  and the FK are created automatically on boot. Verified against the existing
  6 seeded orders: they backfilled correctly and there are 0 orphans.
- Because `synchronize` is on, there are no migration files to write — but
  also no way to roll back. Be careful with non-nullable column additions.

### Why the composite index

The order history query is always "filter by owner, sort by newest, limit N".
`IDX_orders_user_created` lets Postgres do that as a single backward index scan
with **no sort step**. Verified with `EXPLAIN`:

```
 Limit
   ->  Index Scan Backward using "IDX_orders_user_created" on orders
```

Note: on a tiny table the planner will still prefer a `Seq Scan` because
scanning 6 rows is genuinely cheaper. Confirm with
`SET enable_seqscan=off;` when checking that the index is usable.

### Behaviour notes

- `getOrder` now returns **404 instead of 403** for an order belonging to
  someone else. `retryPayment` calls `getOrder`, so it inherits this — a
  non-owner retrying now gets "Order not found" rather than an auth error.
  This is intentional (don't leak that the order exists).
- `listOrders` returns `totalPages: Math.max(1, ...)` so page 1 of an empty
  result set reports `1` rather than `0`. This matches `ProductsService`.

## Seller Shop Orders and Fulfilment (2026-09-27)

Seller order management is separate from buyer order history and Stripe
payment state. A seller can see and update only **PAID** orders that contain
items from a shop they own.

### Data model

- `src/orders/order.entity.ts` keeps `Order.status` as the payment status.
- `src/orders/order-item.entity.ts` defines `OrderItem` and `DeliveryStatus`
  (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- `orders.items` JSON remains the buyer history snapshot. `order_items` is a
  relational mirror with one row per purchased line and adds mutable
  `deliveryStatus`, sticky `acknowledgedAt`, and `deliveryUpdatedAt` fields.
- `OrdersService.createOrder()` writes `orders` and `order_items` in one
  TypeORM transaction before creating the Stripe session. Do not remove the
  mirror write: seller queries depend on its `shopId` index.
- `synchronize: true` creates the entity table/indexes. For existing orders,
  run `npm run orders:backfill-shop-items` from `server/`. It is idempotent;
  it creates missing item rows and then runs read-only seller-query checks.
  There is deliberately no public HTTP backfill endpoint.

### Routes

All routes are under `/api/shop-orders`, protected by `AuthGuard`, and pass
the internal `user.id` UUID (not the Clerk `user.userId`) to shop ownership
checks.

| Method | Route                                                         | Purpose                                                           |
| ------ | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| GET    | `/shop-orders?shopId=&page=&limit=&deliveryStatus=&newOnly=`  | Paid seller inbox; `shopId` omitted means all owned shops.        |
| GET    | `/shop-orders/summary?shopId=`                                | Distinct paid-order badge counters for a shop or all owned shops. |
| GET    | `/shop-orders/summary/by-shop`                                | One-query map of per-shop counters for My Shop cards.             |
| GET    | `/shop-orders/:orderId?shopId=`                               | Seller order detail scoped to one owned shop.                     |
| PATCH  | `/shop-orders/:orderId/delivery-status?shopId=`               | Update every line for this shop/order.                            |
| PATCH  | `/shop-orders/:orderId/items/:itemId/delivery-status?shopId=` | Update one line for split fulfilment.                             |

`deliveryStatus` filters a seller row when any line in that shop/order pair is
at the requested stage. `newOnly=true` filters to pairs with no seller action
yet. Pagination is at the **(order, shop)** grain, not item grain or order-only
grain: a basket spanning two of the seller's shops produces two independently
paginated rows. `total` counts those pairs.

### Status and unread badge semantics

- Seller updates reject orders that are not `PAID` with 400. Shop ownership is
  checked on every list/detail/mutation path; unknown shop is 404, another
  owner's shop is 403.
- `acknowledgedAt` is set once on the first line-level or bulk status action
  and never cleared. One seller action acknowledges that shop/order row even
  if the order contains several lines; later edits do not make it new again.
- `isNew` / `newPaid` mean **paid and not yet actioned**, not
  `deliveryStatus === PENDING`. `newPaid + actioned === total` in a given
  summary scope. The all-shop summary counts distinct orders across the
  seller's shops; the per-shop map counts distinct orders per shop.
- Order-level delivery status aggregates that shop's lines at the earliest
  outstanding stage. All-cancelled lines produce `CANCELLED`; cancelled lines
  are ignored when live lines remain.
- Seller shop-order responses expose `buyerConfirmedAt` so owners can see
  receipt confirmation. After confirmation, seller mutations cannot change
  item statuses. TypeORM `synchronize: true` creates the nullable column.

### Important query implementation details

- Use the `ShopOrdersService` query methods; do not query the JSON
  `orders.items` column for seller filtering. It is not indexed.
- The page query selects distinct `(orderId, shopId)` pairs, then hydrates only
  those pairs. Keep the ordering deterministic (created time, shop id, order
  id) or pagination can repeat/skip rows.
- `order` is a PostgreSQL reserved word. In raw TypeORM select fragments,
  quote the join alias as `"order"` (for example
  `MAX("order"."createdAt")`); using an unquoted alias or the physical table
  name fails because the join has an alias.
- `ListShopOrdersQueryDto` validates numeric paging, enum status, and coerces
  `newOnly` query strings. Global `ValidationPipe` in `main.ts` must retain
  `transform: true`.

### Verification

- `npm run build` validates the Nest app.
- `npm run orders:backfill-shop-items` syncs/backfills and checks summaries,
  pair pagination, new-only filtering, first-action badge clearing (inside a
  transaction that is rolled back), and ownership isolation against the
  configured database. It logs no connection credentials.
- `npx tsc --noEmit -p tsconfig.json` currently reports a pre-existing
  `src/users/users.service.spec.ts` constructor-arity error; `npm run build`
  is the server compile gate.

## Shop List Search, Filter, Sort, and Pagination (2026-09-29)

`GET /shop` is the paginated shop catalog. It previously accepted only `page`
and returned `{ data, page }`, which left the client unable to render a
working pager or filtered result counts.

### Query parameters

| Param        | Type   | Default  | Description                                                    |
| ------------ | ------ | -------- | -------------------------------------------------------------- |
| `page`       | number | `1`      | 1-based page index. Invalid/zero values fall back to `1`.      |
| `search`     | string | —        | Case-insensitive substring match. Blank/whitespace is ignored. |
| `categoryId` | string | —        | Exact `categories.id` match. Omit for all categories.          |
| `sortBy`     | enum   | `newest` | `newest` (createdAt DESC) or `oldest` (createdAt ASC).         |

### Response shape

```ts
{ data: Shop[]; page: number; total: number; totalPages: number }
```

- Page size is fixed at 15 (`limit` in `ShopService.getAllShops`).
- `total` is the count for the _filtered_ result set, not the full table, so
  the client can render an accurate "N shops · Page X of Y" summary.
- `totalPages` is `Math.ceil(total / limit)`, and is `0` when nothing matches.

### Implementation

- `ShopService.getAllShops` uses a TypeORM `QueryBuilder` (was `find`) because
  search spans a joined relation and needs `getManyAndCount` for `total`.
  Relations are preserved via `leftJoinAndSelect` on `user` and `category`.
- Search matches `shop.name`, `shop.address`, `shop.description`, and
  `category.name` using Postgres `ILIKE` with a `%term%` pattern. The term is
  bound as a named parameter (`:search`), never interpolated into SQL.
- `sortBy` is a closed `'newest' | 'oldest'` union in the controller,
  `GetAllShopsDto`, and the service signature. Anything other than `oldest`
  falls through to DESC, so an unknown value can never produce invalid SQL.
- `GetAllShopsDto` mirrors these fields for documentation/validation, but the
  controller reads them via individual `@Query()` params. Note the DTO is not
  currently bound with `@Query() GetAllShopsDto` — do not assume it is
  validated at runtime.

### Conventions to preserve

- Filtering, sorting, and paging are all resolved **server-side**. Do not fetch
  all shops and filter in the browser; `Shop` rows carry `user` and `category`
  relations, so the payload is not cheap.
- The catalog is public, so `GET /shop` must stay unauthenticated and must not
  leak seller-private fields. It returns the `Shop` entity as before.
- When adding a new filter, add it in all four places: controller `@Query()`,
  `GetAllShopsDto`, service signature, and the `QueryBuilder` condition. Keep
  the `total`/`totalPages` contract intact.
- `GET /shop/:id/products` is a separate route with its own pagination
  (`PaginatedResult`); it is unaffected by these catalog filters.

## Seller Dashboard Analytics (2026-09-30)

Adds the aggregation backend behind the shop owner's dashboard. One endpoint,
one request, no N+1.

### Endpoint

`GET /api/shop/:shopId/analytics` — `AuthGuard`, owner-scoped. Scoped to exactly
one shop and one range.

`GET /api/shop/analytics/portfolio` — `AuthGuard`, owner-scoped. Lifetime totals
across **every** shop the caller owns. Takes no shop id and no range, and is
intentionally a _separate_ route (see "Portfolio vs per-shop" below).

| Param         | Values           | Default          | Notes                                  |
| ------------- | ---------------- | ---------------- | -------------------------------------- |
| `granularity` | `day` \| `month` | `day`            | Bucket size for the series.            |
| `from`        | `YYYY-MM-DD`     | shop `createdAt` | Inclusive. **Omitted = "All time"**.   |
| `to`          | `YYYY-MM-DD`     | today (UTC)      | Inclusive.                             |
| `buckets`     | 1–400            | —                | Advisory only; see the hard cap below. |

### Files

- `src/shop/shopAnalytics.service.ts` (NEW) — all aggregation + pure date helpers.
- `src/shop/dto/shop-analytics-query.dto.ts` (NEW) — validated query params.
- `src/shop/shop.controller.ts` — `GET analytics/portfolio` and `GET :id/analytics`.
  The portfolio route is declared **before** the `:id` routes as a matter of
  readability, but note it is safe: `:id` is a single path segment and can never
  match `analytics/portfolio`. If you ever collapse these into `GET :id/:sub`,
  ordering would start to matter — keep them as they are.
- `src/shop/shop.module.ts` — registers `ShopAnalyticsService` + `OrderItem`/`Product`/`Shop` repos.
  `Order` is no longer injected: the aggregates run entirely off `order_items`
  joined to `orders` in raw SQL, so there is no `Repository<Order>` use left.

### Rules that must be preserved

- **Aggregate `order_items`, never `orders.items`.** Revenue is per _shop line_,
  not per order, and `orders.items` is a JSON column that Postgres cannot index
  or aggregate inside. `order_items` is the relational mirror written at order
  creation and is already indexed on `shopId`.
- **A line counts as a sale only when `orders.status = PAID` AND the line's
  `deliveryStatus != CANCELLED`.** This matches `ProductsService` sold-count
  semantics, so the dashboard and the storefront can never disagree.
- **Ownership is scoped by the internal `users.id` UUID** (`user.id`), never the
  Clerk id (`user.userId`) — same rule as the orders module. `assertShopOwnership`
  is called by the controller _before_ any aggregation runs, so an
  unauthorised request costs one indexed lookup and leaks nothing.
- **The series is dense.** Every bucket in range is returned, zero-filled, so the
  chart x-axis is a continuous timeline. SQL groups with `date_trunc` and only
  returns buckets that have sales; gaps are materialised in
  `buildDenseSeries`. Month iteration steps on the 1st and rolls forward, which
  avoids the "31st of the month" overflow trap.
- **All date maths is UTC on both sides.** `from`/`to` are parsed as their
  `YYYY-MM-DD` prefix then pinned to UTC midnight, and SQL uses
  `date_trunc(..., 'UTC')`. A shop owner's "today" therefore never drifts by a
  day depending on where the process runs.
- **Exceeding `MAX_ANALYTICS_BUCKETS` (400) is a 400, not a truncation.** A
  silently truncated series would plot incomplete data with no indication that
  anything was dropped.
- **`previousPeriodTotals` may be `null`.** The UI must render "no comparison"
  rather than invent a percentage. `percentageChange` likewise returns `null`
  for a zero baseline — "up from nothing" is not a growth rate.
- **Route ordering:** `analytics/portfolio` is safe today only because it has
  two literal segments while `:id` has one. Preserve that shape.

## Analytics Performance & Data Split (2026-09-30, round 2)

Second pass over the dashboard backend, driven by two complaints: the API was
slow, and portfolio totals were being re-fetched on every shop switch.

### 1. `order_items.createdAt` — blocking bug, now fixed

Every date-filtered analytics query (`getSeries`, `getTopProducts`) filtered on
`item."createdAt"` — a column that **did not exist**. The live database proved
it: `ERROR: column item.createdAt does not exist`. Any seller opening the
dashboard on a range narrower than "all time" got a 500, not slow results.

`OrderItem` now carries a `createdAt` column. It is deliberately:

- **`nullable: true` in the entity.** Not because it is optional, but because
  TypeORM's `synchronize` cannot add a `NOT NULL` column to an already-populated
  table. It is always set explicitly at insert.
- **Set from `savedOrder.createdAt`, not a `@CreateDateColumn`.** This is the
  part that matters. A `@CreateDateColumn` defaults to _now_, which would file
  any backdated or imported order's line items under the wrong revenue period —
  a silent, permanent data corruption that no test would catch. The snapshot
  must inherit the order's own timestamp.

Existing rows are backfilled with
`UPDATE order_items oi SET "createdAt" = o."createdAt" FROM orders o WHERE oi."orderId" = o.id AND oi."createdAt" IS NULL`.
On a fresh database no backfill is needed.

**Verify the backfill actually ran.** The `UPDATE` can be silently skipped if it
was sent as part of a multi-statement batch that aborted on an earlier
statement, and the symptom is deceptive: queries still _succeed_, they just
return zero rows, so the dashboard looks like a seller with no sales rather
than like a bug. Check with
`SELECT count(*) FROM order_items WHERE "createdAt" IS NULL;` — it must be `0`.
`min("createdAt")` returning `NULL` is the same bug wearing a different hat.

### 2. Indexes added

Three of the dashboard's hot paths were unindexed and doing full table scans:

| Index                          | Table         | Why                                                       |
| ------------------------------ | ------------- | --------------------------------------------------------- |
| `IDX_order_items_shop_created` | `order_items` | `(shopId, createdAt)` — the per-shop range scan           |
| `IDX_products_shop`            | `products`    | Portfolio product count across the owner's shops          |
| `IDX_shops_user`               | `shops`       | Resolving the owner's shop ids before any portfolio query |

All three are declared with `@Index` on the entities (not just created in the
DB) so `synchronize` does not drop them on the next boot. **When adding an index
for performance, add the `@Index` decorator too** — a hand-made index without
the decorator disappears the next time the server starts.

#### `@Index` resolves against PROPERTY names, not column names

This bit us: `IDX_products_shop` and `IDX_shops_user` were declared on
`Product` and `Shop`, which only had the _relation_ (`shop` / `user`) — no
`shopId` / `userId` property. The app refused to boot:

```
TypeOrmModule] Unable to connect to the database. Retrying (1)...
TypeORMError: Index "IDX_products_shop" contains column that is missing in the entity (Product): shopId
```

TypeORM matches `@Index` argument strings against decorated **properties**. A
`@ManyToOne` generates a DB column called `shopId`, but the property is still
named `shop`, so `"shopId"` resolves to nothing. Two notes on the failure mode:

- It is **not** a "column missing from the database" error, even though the
  column genuinely exists and is indexed. Nothing about the live schema is
  wrong — the entity metadata is.
- It **aborts at the first bad entity**, so `IDX_shops_user` had the identical
  defect and was simply not reached. Fixing only the reported index would have
  moved the error to the next boot. **When you see this, audit every `@Index`
  in the project**, don't just the one in the message.

**The fix is the explicit scalar FK pair**, which `OrderItem`, `Order` and
`ProductReview` already used correctly:

```ts
@ManyToOne(() => Shop, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'shopId' })
shop?: Shop;

@Column({ type: 'uuid', nullable: true })
shopId?: string | null;
```

`Product.shopId` and `Shop.userId` were added in this shape. The rule for this
codebase: **if you write `@Index` on a foreign key, the entity must also declare
the scalar FK column.** Queries keep using the relation (`where: { shop: { id } }`),
which TypeORM maps onto that column — no caller changes.

`@JoinColumn({ name: 'shopId' })` is required once the scalar exists, otherwise
TypeORM defaults the join column to the relation name (`shop`) and you end up
with two competing columns.

### 3. Three scans collapsed into one

`getShopAnalytics` used to run `getTotals()` **three times** (lifetime, current
window, previous window), each a full aggregate over `order_items`. That is now
`getWindowedAggregates()`: a single query returning all nine figures via
`SUM(...) FILTER (WHERE ...)` and `COUNT(DISTINCT ...) FILTER (WHERE ...)`.

Postgres evaluates conditional aggregates in one pass, so the row is read once
instead of three times. When the previous window is `null` (a shop too new to
have a prior period) its `FILTER` expressions are omitted from the SQL entirely
rather than sent as a dead `FILTER (WHERE false)`.

**`FILTER` is load-bearing, not stylistic.** Writing `SUM(x) AND <predicate>`
instead of `SUM(x) FILTER (WHERE <predicate>)` is a _type_ error, not a
stylistic one: Postgres evaluates it as a boolean AND between a `double
precision` and a `boolean` and rejects it with
`argument of AND must be type boolean, not type double precision`. This bit us
once already — the previous-window expressions were written the `AND` way and
would have 500'd on any shop old enough to have a prior period, while working
fine for a brand-new shop. The same applies to the surrounding
`COALESCE(..., 0)`, which is why the count is `COALESCE(COUNT(...) FILTER
(...), 0)` and not a bare `COUNT(...)`.

`getWindowedAggregates`, `getSeries` and `getTopProducts` now run under a single
`Promise.all` with the product count — the four queries are independent and the
database is not the bottleneck any more.

### 4. Portfolio split from per-shop analytics

`portfolio` was a field on the per-shop analytics payload. That was a
correctness problem disguised as convenience: the numbers are identical for
every shop the seller owns, so they _cannot_ belong to a payload keyed by
`shopId` + range. The client had no choice but to refetch them on every shop
switch and discard the previous value.

Now:

- `ShopAnalyticsResult` has **no** `portfolio` field.
- `getPortfolioTotals(userId)` returns `ShopPortfolioResult` and is served by its
  own route.
- It resolves the owner's shop ids once, then does a product `count` and a
  single grouped `order_items` query with `shopId IN (:...shopIds)` — two
  queries total, regardless of how many shops the seller runs.
- It returns `totalOrders` in addition to the two counts, so a portfolio-level
  order count does not need the client to sum across shops.

A seller with no shops must get `{ totalShops: 0, totalProducts: 0, … }`, not an
error or `null` — `In([])` generates invalid SQL, so the empty case is
short-circuited before the query is built.

### Known limitation (not a bug)

"Total earnings" is **gross revenue**. Stripe fees, refunds and platform
commission are not subtracted because no fee or refund model exists in the
schema. If one is added, `order_items` is the right place to model the
refundable amount — do not try to derive net revenue in the client.

### Bug fixed alongside this work

`ShopAuthorizationService.assertShopOwner` **returned** a `ForbiddenException`
instead of throwing it. Every caller awaited the result without inspecting it,
so the check was a no-op and any authenticated user could read or delete any
shop by id. Now thrown. If you add another authorization helper in this
codebase, note that a bare `return new SomeException()` silently grants access.

### Response shape

```jsonc
{
  "shopId": "uuid", "shopName": "...", "currency": "usd",
  "averageOrderValue": 42.5,        // null when no orders in period
  "totals": { "revenue": 0, "unitsSold": 0, "orders": 0 },              // lifetime
  "periodTotals": { "revenue": 0, "unitsSold": 0, "orders": 0 },        // window
  "previousPeriodTotals": { /* … */ } | null,                           // prior window
  "productCount": 0,                                                  // this shop
  "range": { "from": "2026-03-05", "to": "2026-04-03", "granularity": "day" },
  "series": [{ "bucket": "2026-03-05", "label": "Mar 5",
               "unitsSold": 0, "revenue": 0, "orders": 0 }],
  "topProducts": [{ "productId": "uuid" | null, "name": "…",
                    "unitsSold": 0, "revenue": 0 }]
}
```

Portfolio totals are a **different payload**, from `GET /shop/analytics/portfolio`:

```jsonc
{
  "totalShops": 0, // all owner's shops
  "totalProducts": 0, // across all of them
  "totalRevenue": 0, // lifetime, gross
  "totalUnitsSold": 0,
  "totalOrders": 0,
  "currency": "usd",
}
```

`topProducts` groups by the snapshot `productId` and falls back to the snapshot
`name`, so a since-deleted product still appears in history (flagged
"delisted" in the UI) instead of silently vanishing.
