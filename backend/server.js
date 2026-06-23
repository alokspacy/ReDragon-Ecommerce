require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import controllers & middleware
const { protect, admin } = require('./middleware/auth');
const upload = require('./middleware/upload');
const authController = require('./controllers/authController');
const productController = require('./controllers/productController');
const storeController = require('./controllers/storeController');
const orderController = require('./controllers/orderController');
const couponController = require('./controllers/couponController');
const ratingController = require('./controllers/ratingController');
const addressController = require('./controllers/addressController');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*', // In production, replace with your exact Vercel frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create uploads directory static route
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve placeholder images if they don't exist
const placeholderFile = path.join(uploadsPath, 'placeholder.png');
if (!fs.existsSync(placeholderFile)) {
  // Write a very simple 1x1 transparent PNG fallback if file doesn't exist
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  fs.writeFileSync(placeholderFile, Buffer.from(base64Png, 'base64'));
}
app.use('/uploads', express.static(uploadsPath));

// 2. Regular JSON parser for all other requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Authentication Routes
app.post('/api/auth/register', authController.registerUser);
app.post('/api/auth/login', authController.loginUser);
app.get('/api/auth/me', protect, authController.getMe);
app.put('/api/auth/cart', protect, authController.updateCart);

// Products Routes
app.get('/api/products', productController.getProducts);
app.get('/api/products/:id', productController.getProductById);
app.post('/api/products', protect, upload.array('images', 4), productController.createProduct);
app.put('/api/products/:id', protect, upload.array('images', 4), productController.updateProduct);
app.delete('/api/products/:id', protect, productController.deleteProduct);

// Stores Routes
app.post('/api/stores', protect, upload.single('logo'), storeController.createStore);
app.get('/api/stores/status', protect, storeController.getStoreStatus);
app.get('/api/stores/my-store', protect, storeController.getMyStore);
app.get('/api/stores/dashboard', protect, storeController.getSellerDashboard);
app.get('/api/stores', protect, admin, storeController.getStores);
app.put('/api/stores/:id/approve', protect, admin, storeController.approveStore);
app.get('/api/stores/public/:username', storeController.getPublicStore);

// Orders Routes
app.post('/api/orders', protect, orderController.createOrder);
app.get('/api/orders', protect, orderController.getUserOrders);
app.get('/api/orders/store', protect, orderController.getStoreOrders);
app.put('/api/orders/:id/status', protect, orderController.updateOrderStatus);
app.get('/api/orders/admin-dashboard', protect, admin, orderController.getAdminDashboard);
app.post('/api/orders/verify-razorpay', protect, orderController.verifyRazorpayPayment);
app.post('/api/orders/mock-pay/:id', orderController.mockRazorpayPayment);

// Coupons Routes
app.get('/api/coupons', protect, admin, couponController.getCoupons);
app.post('/api/coupons', protect, admin, couponController.createCoupon);
app.delete('/api/coupons/:code', protect, admin, couponController.deleteCoupon);
app.get('/api/coupons/validate', protect, couponController.validateCoupon);

// Ratings Routes
app.post('/api/ratings', protect, ratingController.addProductRating);
app.get('/api/ratings/product/:productId', ratingController.getProductRatings);

// Address Routes
app.get('/api/address', protect, addressController.getAddresses);
app.post('/api/address', protect, addressController.addAddress);
app.delete('/api/address/:id', protect, addressController.deleteAddress);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Server refreshed after DB seeding and migrations
