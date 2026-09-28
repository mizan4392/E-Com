# Products Module Agent Documentation

## Overview

This module handles product-related operations including retrieval and updates with file upload support.

## API Endpoints

### GET /products/:id

- **Purpose**: Get product details by ID
- **Auth**: None
- **Response**: Product with shop and category relations

### PATCH /products/:id

- **Purpose**: Update product with optional multiple file uploads
- **Auth**: Required (AuthGuard)
- **Content-Type**: multipart/form-data
- **Body Fields** (all optional):
  - `name` (string): Product name
  - `description` (string): Product description
  - `category` (string): Product category
  - `price` (number): Product price
  - `stock` (number): Product stock quantity
  - `files` (File[]): Multiple image files (max 10, 10MB each)

## Files Structure

```
products/
├── dto/
│   └── update-product.dto.ts    # Validation DTO for updates
├── products.controller.ts       # HTTP endpoints
├── products.service.ts         # Business logic
└── products.module.ts          # Module definition
```

## Implementation Details

### Controller (products.controller.ts)

- Uses `FilesInterceptor('files', 10)` for handling up to 10 files
- Files are mapped to include: `name`, `path`, `filename`
- Delegates to service for business logic

### Service (products.service.ts)

- `update(id, data)`: Updates product, appending new images to existing ones
- Throws `NotFoundException` if product not found
- Preserves existing `imageUrl` array when adding new files

### DTO (update-product.dto.ts)

- Uses class-validator for validation
- All fields are optional for partial updates

## Usage Example

```bash
curl -X PATCH http://localhost:3000/products/123 \
  -H "Authorization: Bearer <token>" \
  -F "name=Updated Product" \
  -F "price=99.99" \
  -F "files=@image1.jpg" \
  -F "files=@image2.png"
```

## Verified Product Reviews

- `GET /products/:productId/reviews?page=&limit=` is public and paginated.
- `GET /orders/:orderId/reviews` returns delivered, reviewable order items for
  the signed-in buyer. `PUT /orders/:orderId/reviews/:orderItemId` creates or
  edits one review for that purchased line.
- Reviews require a paid, buyer-confirmed order and a `DELIVERED` order item.
  Enforce order ownership, reject self-reviews, validate integer ratings from
  1 to 5, and require a trimmed message of 3 to 2000 characters.
- `ProductReview` is unique per order item. It stores the review text, score,
  and privacy-safe reviewer-name snapshot. Never trust a client-supplied buyer
  or product id; resolve both from the owned order item.
- `Product.rating` and `Product.reviewCount` are maintained in the same
  transaction as review create/edit. Lock the product row during aggregate
  updates, and adjust the existing score rather than incrementing count on an
  edit. TypeORM `synchronize: true` creates the table, foreign keys and indexes.
