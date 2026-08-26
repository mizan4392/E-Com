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
