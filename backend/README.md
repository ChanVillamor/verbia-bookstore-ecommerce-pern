# Book E-Commerce Backend

This is the backend server for the Book E-Commerce application, built with Node.js, Express, and PostgreSQL.

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=book_ecommerce
```

3. Set up the PostgreSQL database:

```bash
psql -U your_db_user -d book_ecommerce -f src/db/schema.sql
```

4. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Products

- `GET /api/products` - Get all products
- `GET /api/products/sale` - Get products on sale
- `GET /api/products/bestselling` - Get best-selling products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders

- `POST /api/orders` - Create new order (protected)
- `GET /api/orders/my-orders` - Get user's orders (protected)
- `GET /api/orders/:id` - Get single order (protected)
- `PUT /api/orders/:id/status` - Update order status (admin only)

### Reviews

- `POST /api/reviews` - Create new review (protected)
- `GET /api/reviews/product/:product_id` - Get product reviews
- `PUT /api/reviews/:id` - Update review (protected)
- `DELETE /api/reviews/:id` - Delete review (protected)
- `GET /api/reviews/my-reviews` - Get user's reviews (protected)

### Wishlist

- `POST /api/wishlist` - Add item to wishlist (protected)
- `DELETE /api/wishlist/:product_id` - Remove item from wishlist (protected)
- `GET /api/wishlist` - Get user's wishlist (protected)
- `GET /api/wishlist/check/:product_id` - Check if item is in wishlist (protected)

### Promo Codes

- `GET /api/promo/active` - Get active promo codes
- `GET /api/promo/validate/:code` - Validate promo code
- `POST /api/promo` - Create new promo code (admin only)
- `PUT /api/promo/:id` - Update promo code (admin only)
- `DELETE /api/promo/:id` - Delete promo code (admin only)

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Database Schema

The database includes the following tables:

- users
- products
- orders
- order_details
- reviews
- wishlist
- promo_codes

See `src/db/schema.sql` for detailed schema information.
