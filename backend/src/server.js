const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');

// Import Route Modules
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const returnRoutes = require('./routes/returnRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    project: 'Travel Library & Book Rental System API',
    status: 'Running',
    healthCheck: '/api/health',
    availableEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/books',
      'GET /api/books/:id',
      'GET /api/libraries',
      'GET /api/libraries/:id',
      'GET /api/connections',
      'POST /api/rentals',
      'GET /api/rentals/:id',
      'GET /api/rentals/user/:userId',
      'POST /api/returns',
      'GET /api/admin/dashboard'
    ]
  });
});

// Health-check API Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Travel Library & Book Rental System API is healthy and operational.',
    timestamp: new Date().toISOString(),
    service: 'Travel-Library-Backend',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/libraries', libraryRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for Undefined Routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found - ${req.originalUrl}`
  });
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack || err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server and test Database connection
app.listen(PORT, async () => {
  console.log(`=================================`);
  console.log(`🚀 Travel Library Backend Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
  await testConnection();
});
