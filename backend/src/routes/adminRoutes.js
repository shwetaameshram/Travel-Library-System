const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');

// Apply requireAdmin authorization middleware to all admin routes
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Books Management
router.get('/books', adminController.getAllBooks);
router.post('/books', adminController.createBook);
router.put('/books/:id', adminController.updateBook);
router.delete('/books/:id', adminController.deleteBook);

// Libraries Management
router.get('/libraries', adminController.getAllLibraries);
router.post('/libraries', adminController.createLibrary);
router.put('/libraries/:id', adminController.updateLibrary);
router.delete('/libraries/:id', adminController.deleteLibrary);

// Stock Management
router.get('/stock', adminController.getStockAdmin);
router.post('/stock', adminController.addOrUpdateStock);

// Connections Management
router.get('/connections', adminController.getConnectionsAdmin);
router.post('/connections', adminController.createConnection);
router.put('/connections/:id', adminController.updateConnection);
router.delete('/connections/:id', adminController.deleteConnection);

// Rentals & Returns Audit
router.get('/rentals', adminController.getRentalsAdmin);
router.get('/returns', adminController.getReturnsAdmin);

module.exports = router;
