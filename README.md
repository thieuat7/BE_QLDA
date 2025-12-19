# QLDA Project - MVC Structure

## Project Structure

```
qlda_nhom10/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── config.js           # Database configuration
│   │   └── passport.mjs       # Passport authentication config
│   │
│   ├── controllers/           # Business logic handlers
│   │   ├── AuthController.js
│   │   ├── CartController.js
│   │   ├── CategoryController.js
│   │   ├── DiscountController.js
│   │   ├── OrderController.js
│   │   ├── OrderController_Simple.js
│   │   ├── PaymentController.js
│   │   ├── PaymentHistoryController.js
│   │   ├── ProductController.js
│   │   ├── StatsController.js
│   │   ├── UserController.js
│   │   └── VnExpressController.js
│   │
│   ├── database/              # Database configuration & utilities
│   │   ├── database.mjs       # Database connection
│   │   └── migrations/
│   │       ├── *.cjs          # Sequelize migration files
│   │       └── sql/           # Raw SQL migration files
│   │
│   ├── middleware/            # Express middlewares
│   │   ├── auth.js
│   │   ├── authMiddleware.js
│   │   └── upload.js
│   │
│   ├── migrations/            # Sequelize migrations (old structure)
│   │   └── *.cjs
│   │
│   ├── models/                # Sequelize data models
│   │   ├── index.js
│   │   ├── user.js
│   │   ├── product.js
│   │   ├── category.js
│   │   ├── order.js
│   │   └── ... (other models)
│   │
│   ├── routes/                # Route definitions
│   │   ├── router.js          # Main router (mount all routes)
│   │   ├── authRouter.js
│   │   ├── userRouter.js
│   │   ├── productRouter.js
│   │   ├── categoryRouter.js
│   │   ├── cartRouter.js
│   │   ├── orderRouter.js
│   │   ├── paymentRouter.js
│   │   ├── discountRouter.js
│   │   ├── statsRouter.js
│   │   └── ... (other routers)
│   │
│   ├── scripts/               # Utility scripts for database manipulation
│   │   ├── add-*.mjs
│   │   ├── check-*.mjs
│   │   ├── fix-*.mjs
│   │   ├── migrate-*.mjs
│   │   ├── run-migration.mjs
│   │   └── ... (other scripts)
│   │
│   ├── services/              # Business logic services (optional)
│   │   └── (To be created as needed)
│   │
│   ├── utils/                 # Utility functions
│   │   └── (To be created as needed)
│   │
│   ├── seeders/               # Database seeders
│   │   └── (seeder files)
│   │
│   ├── public/                # Static files
│   │   └── homepage.css
│   │
│   └── server.mjs             # Main server entry point
│
├── public/                    # Public assets (images, uploads)
│   └── Uploads/
│       └── products/
│
├── .sequelizerc               # Sequelize configuration
├── package.json               # Project dependencies
├── .gitignore                 # Git ignore file
└── README.md                  # This file
```
All routes are mounted through `src/routes/router.js`:

```javascript
GET  /api/products           - Get all products
POST /api/products           - Create product (admin)
GET  /api/products/:id       - Get product detail
PUT  /api/products/:id       - Update product (admin)
DELETE /api/products/:id    - Delete product (admin)

GET  /api/categories         - Get all categories
POST /api/categories         - Create category (admin)

GET  /api/cart               - Get cart
POST /api/cart               - Add to cart
PUT  /api/cart/:id           - Update cart item
DELETE /api/cart/:id        - Remove from cart

GET  /api/orders             - Get orders
POST /api/orders             - Create order
GET  /api/orders/:id         - Get order detail

POST /api/payment/vnpay/create-url     - Create VNPAY payment
POST /api/payment/momo/create-url      - Create MOMO payment
GET  /api/payment/bank-info            - Get bank transfer info

GET  /api/auth/me            - Get current user
POST /api/auth/register      - Register
POST /api/auth/login         - Login
```

## Database Migrations

### Running Migrations
```bash
# Run all migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Create new migration
npx sequelize-cli migration:generate --name migration-name
```