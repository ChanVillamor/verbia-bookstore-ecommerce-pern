const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://verbia-bookstore-ecommerce-pern.vercel.app',
    'http://localhost:5173' 
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
const uploadsPath = path.join(__dirname, '../uploads');
const productsUploadsPath = path.join(__dirname, '../uploads/products');

console.log('Serving static files from:', uploadsPath);
console.log('Serving product images from:', productsUploadsPath);

app.use('/uploads', express.static(uploadsPath));
app.use('/uploads/products', express.static(productsUploadsPath));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin/products', require('./routes/adminProducts'));
app.use('/api/admin/categories', require('./routes/adminCategories'));
app.use('/api/admin/orders', require('./routes/adminOrders'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/dashboard', require('./routes/adminDashboard'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app; 