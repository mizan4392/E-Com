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

- src/orders provides authenticated POST /orders, GET /orders, GET /orders/:id, and POST /orders/:id/retry-payment endpoints.
- Orders store a server-calculated total, product/shop snapshots, Stripe IDs, and PENDING, PAID, PAYMENT_FAILED, or CANCELLED status.
- POST /stripe/webhook verifies Stripe signatures against the raw body and handles completed, asynchronous success/failure, expired Checkout Sessions, and payment-intent success/failure events. PaymentIntent metadata includes orderId.
- Required server variables are STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and CLIENT_BASE_URL. Configure the webhook endpoint as /api/stripe/webhook.
- Retry creates a fresh Checkout Session for an unpaid order and resets it to PENDING; webhook events are the source of truth for final payment status.

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

| Method | Route                           | Notes                                            |
| ------ | ------------------------------- | ------------------------------------------------ |
| GET    | `/api/orders`                   | Paginated + status filter. Scoped to the caller. |
| GET    | `/api/orders/:id`               | Single order, owner-scoped. 404 if not yours.    |
| POST   | `/api/orders`                   | Unchanged — creates order + Stripe session.      |
| POST   | `/api/orders/:id/retry-payment` | Unchanged.                                       |

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
