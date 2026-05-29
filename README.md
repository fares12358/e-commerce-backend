# E-Commerce Backend API - Store6

**API Documentation:** https://e-commerce-backend-store6.vercel.app/api/docs

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                  # Express app configuration
│   ├── routes.js               # Main routes configuration
│   ├── server.js               # Server startup file
│   ├── config/                 # Configuration files
│   │   ├── cloudinary.js      # Cloudinary configuration
│   │   └── db.js              # Database connection
│   ├── docs/                   # API documentation
│   │   ├── docs.html          # Swagger UI documentation
│   │   └── docs.routes.js     # Documentation routes
│   ├── middlewares/            # Custom middlewares
│   │   ├── admin.middleware.js # Admin authorization
│   │   ├── auth.middleware.js  # Authentication middleware
│   │   ├── checkBackendStatus.js # Health check
│   │   ├── error.middleware.js # Error handling
│   │   ├── multer.js           # File upload handling
│   │   ├── rateLimit.js       # Rate limiting
│   │   └── verifyOwner.js     # Resource ownership
│   ├── modules/                # Feature modules
│   │   ├── admin/             # Admin management
│   │   ├── ads/               # Advertisements
│   │   ├── attribute/        # Product attributes
│   │   ├── auth/              # Authentication
│   │   ├── cart/              # Shopping cart
│   │   ├── category/         # Categories
│   │   ├── contact/           # Contact forms
│   │   ├── contorlles/       # Controllers endpoint
│   │   ├── data/              # Data management
│   │   ├── notification/     # Notifications
│   │   ├── order/            # Orders
│   │   ├── product/          # Products
│   │   ├── telegram/         # Telegram integration
│   │   └── users/            # User management
│   ├── services/              # Business logic services
│   │   └── telegram.service.js # Telegram service
│   └── utils/                  # Utility functions
│       ├── cloudinary.js      # Cloudinary utility
│       ├── pusher.js          # Pusher utility
│       └── sendEmail.js       # Email sending utility
├── package.json               # Dependencies
├── vercel.json               # Vercel configuration
└── .gitignore                # Git ignore file
```

## 🛠️ Technology Stack

### Core Framework
- **Express 5** - Web framework for Node.js
- **ES Modules** - Modern JavaScript modules
- **Nodemon** - Development server with auto-reload

### Database
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

### Authentication & Security
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **express-rate-limit** - Rate limiting
- **cors** - Cross-origin resource sharing
- **cookie-parser** - Cookie parsing

### File Management
- **Cloudinary** - Cloud image hosting
- **Multer** - File upload middleware
- **Sharp** - Image processing

### Communication
- **Pusher** - Real-time communication
- **Nodemailer** - Email sending
- **Axios** - HTTP client

### Development & Testing
- **dotenv** - Environment variables
- **@faker-js/faker** - Fake data generation

## 🔄 Data Flow Architecture

### 1. Request Flow
```
Client Request → Express Router → Middleware → Controller → Service → Model → Database
```

### 2. Authentication Flow
```
Login → JWT Generation → Token Storage → Request Authentication → Resource Access
```

### 3. File Upload Flow
```
Client Upload → Multer Processing → Cloudinary Storage → Database Reference
```

### 4. Real-time Communication
```
Event Trigger → Pusher Notification → Client WebSocket → UI Update
```

### 5. Email Flow
```
Trigger → Email Template → Nodemailer → SMTP Server → Client Inbox
```

### 6. Telegram Integration
```
Webhook → Telegram API → Message Processing → Response Handling
```

## 🔧 Main Modules & Functions

### Authentication Module (`/auth`)
- **Functions**:
  - `registerUser` - User registration
  - `loginUser` - User login
  - `logoutUser` - User logout
  - `forgotPassword` - Request password reset
  - `resetPassword` - Reset password with token
  - `refreshToken` - Refresh access token
  - `getOtp` - Get OTP for authentication
  - `verifyOtp` - Verify OTP code
  - `resendOtp` - Resend OTP code

### Admin Module (`/admin`)
- **Functions**:
  - `adminLogin` - Admin authentication
  - `getAdminProfile` - Get admin profile
  - `updateAdminProfile` - Update admin profile
  - `changeAdminPassword` - Change admin password
  - `getUsers` - Get all users
  - `toggleUserStatus` - Activate/suspend users
  - `deleteUser` - Delete user account
  - `getDashboardStats` - Get dashboard statistics
  - `getRefundFlag` - Get refund feature status
  - `updateRefundFlag` - Update refund feature status
  - `getConfig` - Get system configuration
  - `updateConfig` - Update system configuration
  - `updateMainContent` - Update main content
  - `addContentSection` - Add content section
  - `updateContentSection` - Update content section
  - `deleteContentSection` - Delete content section

### User Module (`/users`)
- **Functions**:
  - `getUserProfile` - Get user profile
  - `updateUserProfile` - Update user profile
  - `updateUserLocation` - Update user location
  - `getUserOrders` - Get user orders
  - `updateUserPassword` - Update user password

### Product Module (`/products`)
- **Functions**:
  - `createProduct` - Create new product
  - `getProducts` - Get all products
  - `getProductById` - Get single product
  - `updateProduct` - Update product
  - `deleteProduct` - Delete product
  - `toggleProductStatus` - Activate/deactivate product
  - `addProductAttribute` - Add product attribute
  - `updateProductAttribute` - Update product attribute
  - `deleteProductAttribute` - Delete product attribute
  - `addProductImage` - Add product image
  - `updateProductImage` - Update product image
  - `deleteProductImage` - Delete product image
  - `getPublicProducts` - Get public products
  - `getProductDetails` - Get product details

### Category Module (`/categories`)
- **Functions**:
  - `createCategory` - Create category
  - `getCategories` - Get all categories
  - `getCategoryById` - Get single category
  - `updateCategory` - Update category
  - `deleteCategory` - Delete category
  - `toggleCategoryStatus` - Activate/deactivate category
  - `getPublicCategories` - Get public categories
  - `getCategoryProducts` - Get category products

### Order Module (`/orders`)
- **Functions**:
  - `createOrder` - Create new order
  - `getOrders` - Get all orders
  - `getOrderById` - Get single order
  - `updateOrderStatus` - Update order status
  - `cancelOrder` - Cancel order
  - `getUserOrders` - Get user orders
  - `approveRefund` - Approve refund request
  - `rejectRefund` - Reject refund request
  - `markProductReceived` - Mark product received
  - `markMoneyRefunded` - Mark money refunded
  - `getOrderStats` - Get order statistics

### Cart Module (`/cart`)
- **Functions**:
  - `addToCart` - Add item to cart
  - `getCart` - Get user cart
  - `updateCartItem` - Update cart item
  - `removeFromCart` - Remove item from cart
  - `clearCart` - Clear entire cart

### Ads Module (`/admin/ads`)
- **Functions**:
  - `createAd` - Create advertisement
  - `getAds` - Get all ads
  - `getAdById` - Get single ad
  - `updateAd` - Update advertisement
  - `deleteAd` - Delete advertisement

### Notification Module (`/admin/notification`)
- **Functions**:
  - `getNotificationSettings` - Get notification settings
  - `updateNotificationSettings` - Update notification settings

### Contact Module (`/contact`)
- **Functions**:
  - `createContact` - Submit contact form
  - `getContacts` - Get all contacts
  - `deleteContact` - Delete contact

### Data Module (`/data`)
- **Functions**:
  - `getData` - Get system data
  - `updateData` - Update system data

### Telegram Module (`/telegram`)
- **Functions**:
  - `sendOrderNotification` - Send order notification
  - `sendStatsNotification` - Send statistics notification
  - `handleWebhook` - Handle Telegram webhook

## 📦 Dependencies

### Production Dependencies
```json
{
  "@faker-js/faker": "^10.2.0",
  "axios": "^1.13.6",
  "bcryptjs": "^3.0.3",
  "cloudinary": "^2.9.0",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5",
  "crypto": "^1.0.1",
  "dotenv": "^17.2.3",
  "express": "^5.2.1",
  "express-rate-limit": "^8.2.1",
  "faker": "^6.6.6",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.1.5",
  "multer": "^2.0.2",
  "nodemailer": "^7.0.12",
  "pusher": "^5.3.2",
  "sharp": "^0.34.5"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.1.11"
}
```

## 🚀 Features

### Core Features
- **User Authentication** - JWT-based authentication with OTP support
- **Admin Panel** - Complete admin management system
- **Product Management** - Full CRUD operations for products
- **Order Processing** - Complete order lifecycle management
- **User Management** - User accounts and profiles
- **Category Management** - Product categorization
- **Shopping Cart** - Cart functionality
- **Payment Integration** - Order payment processing
- **File Upload** - Image and file management
- **Real-time Updates** - Pusher integration
- **Email System** - Email notifications
- **Telegram Integration** - Automated messaging

### Security Features
- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - API request throttling
- **CORS Protection** - Cross-origin security
- **Password Hashing** - bcrypt password encryption
- **Input Validation** - Request validation and sanitization
- **Error Handling** - Comprehensive error management
- **Resource Ownership** - User-specific data access

### File Management
- **Cloudinary Integration** - Cloud-based image hosting
- **Image Processing** - Sharp image optimization
- **Multer Upload** - File upload handling
- **Size Optimization** - Automatic image resizing

### Real-time Features
- **Pusher Integration** - Real-time notifications
- **Order Updates** - Live order status updates
- **User Notifications** - Real-time user alerts
- **Admin Dashboard** - Live data updates

### Communication
- **Email Notifications** - Automated email system
- **Telegram Webhooks** - Automated messaging
- **Contact Forms** - User communication
- **Notification Settings** - Customizable alerts

### Analytics & Reporting
- **Dashboard Statistics** - Business metrics
- **Order Statistics** - Sales analytics
- **User Analytics** - User behavior tracking
- **Performance Monitoring** - System health checks

## 🔒 Middlewares

### Authentication Middlewares
- **auth.middleware.js** - JWT authentication
- **admin.middleware.js** - Admin authorization
- **verifyOwner.js** - Resource ownership verification

### Security Middlewares
- **rateLimit.js** - Request rate limiting
- **checkBackendStatus.js** - Health monitoring
- **error.middleware.js** - Error handling

### File Handling
- **multer.js** - File upload middleware

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/otp` - Get OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile
- `PUT /api/admin/change-password` - Change password
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/toggle-status` - Toggle user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/dashboard/stats` - Get dashboard stats
- `GET /api/admin/refund-flag` - Get refund flag
- `PUT /api/admin/refund-flag` - Update refund flag
- `GET /api/admin/config` - Get config
- `PUT /api/admin/config` - Update config
- `PUT /api/admin/content/main` - Update main content
- `POST /api/admin/content/section` - Add content section
- `PUT /api/admin/content/section` - Update content section
- `DELETE /api/admin/content/section` - Delete content section

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/location` - Update location
- `GET /api/users/orders` - Get user orders
- `PUT /api/users/password` - Update password

### Products
- `POST /api/admin/products` - Create product
- `GET /api/admin/products` - Get all products
- `GET /api/admin/products/:id` - Get product by ID
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PATCH /api/admin/products/:id` - Toggle product status
- `POST /api/admin/products/:id/attributes` - Add attribute
- `PUT /api/admin/products/:id/attributes` - Update attribute
- `DELETE /api/admin/products/:id/attributes/:attrId` - Delete attribute
- `POST /api/admin/products/:id/images` - Add image
- `PUT /api/admin/products/:id/images` - Update image
- `DELETE /api/admin/products/:id/images/:imgId` - Delete image
- `GET /api/products` - Get public products
- `GET /api/products/:id` - Get product details

### Categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/categories` - Get all categories
- `GET /api/admin/categories/:id` - Get category by ID
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `PATCH /api/admin/categories/:id` - Toggle category status
- `GET /api/categories` - Get public categories
- `GET /api/categories/:id/products` - Get category products

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/stats` - Get order statistics
- `PATCH /api/orders/:id/refund/approve` - Approve refund
- `PATCH /api/orders/:id/refund/reject` - Reject refund
- `PATCH /api/orders/:id/refund/product-received` - Mark product received
- `PATCH /api/orders/:id/refund/money-refunded` - Mark money refunded
- `GET /api/users/orders` - Get user orders

### Cart
- `POST /api/cart` - Add to cart
- `GET /api/cart` - Get cart
- `PUT /api/cart` - Update cart
- `DELETE /api/cart/:id` - Remove from cart
- `DELETE /api/cart` - Clear cart

### Ads
- `POST /api/admin/ads` - Create ad
- `GET /api/admin/ads` - Get all ads
- `GET /api/admin/ads/:id` - Get ad by ID
- `PUT /api/admin/ads/:id` - Update ad
- `DELETE /api/admin/ads/:id` - Delete ad

### Notifications
- `GET /api/admin/notification` - Get notification settings
- `PUT /api/admin/notification` - Update notification settings

### Contact
- `POST /api/contact` - Create contact
- `GET /api/contact` - Get all contacts
- `DELETE /api/contact/:id` - Delete contact

### Data
- `GET /api/data` - Get system data
- `PUT /api/data` - Update system data

### Telegram
- `POST /api/telegram/order-notification` - Send order notification
- `POST /api/telegram/stats-notification` - Send stats notification

### Controllers
- `GET /api/controllers` - Controllers endpoint

### Documentation
- `GET /api/docs` - API documentation

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables
- `PORT` - Server port
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRE` - JWT expiration time
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `PUSHER_APP_ID` - Pusher app ID
- `PUSHER_KEY` - Pusher key
- `PUSHER_SECRET` - Pusher secret
- `PUSHER_CLUSTER` - Pusher cluster
- `EMAIL_HOST` - Email host
- `EMAIL_PORT` - Email port
- `EMAIL_USER` - Email username
- `EMAIL_PASS` - Email password
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `VERCEL_URL` - Vercel URL (for production)

## 📊 Performance & Scaling

- **Database Indexes** - Optimized query performance
- **Connection Pooling** - Efficient database connections
- **Caching** - Response caching strategies
- **Load Balancing** - Horizontal scaling support
- **CDN Integration** - Static asset delivery

## 🔧 Configuration

### Express Configuration
- JSON body parsing
- Cookie parsing
- CORS enabled
- Trust proxy settings

### Database Configuration
- Mongoose connection
- Connection error handling
- Query optimization

### Security Configuration
- JWT settings
- Rate limiting
- CORS policies
- Input validation

## 📱 Mobile & API Compatibility

- **REST API** - Standard REST endpoints
- **JSON Format** - Consistent JSON responses
- **Error Handling** - Standard error responses
- **Status Codes** - HTTP status codes
- **Versioning** - API version support

## 🌐 Internationalization

- **Multi-language Support** - Framework for localization
- **Unicode Support** - Full Unicode character support
- **Date Formatting** - International date handling
- **Currency Support** - Multiple currency formats

## 📚 API Documentation

- **Swagger UI** - Interactive API documentation
- **Endpoint Descriptions** - Detailed endpoint information
- **Request/Response Examples** - Sample requests and responses
- **Authentication Guide** - Authentication documentation
- **Error Codes** - Complete error code reference

---

**Built with Express, MongoDB, and Node.js**