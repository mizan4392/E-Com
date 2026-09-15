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
