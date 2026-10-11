const express = require('express');
const router = express.Router();
const { requireLibrarian } = require('../middleware/librarianMiddleware');
const librarianController = require('../controllers/librarianController');

// All librarian routes require librarian authentication
router.use(requireLibrarian);

// GET /api/librarian/dashboard
router.get('/dashboard', librarianController.getDashboardStats);

// Stock Management
router.get('/stock', librarianController.getBranchStock);
router.post('/stock', librarianController.addOrUpdateBranchStock);

// Book Catalog Management
router.get('/books', librarianController.getBranchBooks);
router.post('/books', librarianController.createBranchBook);
router.put('/books/:id', librarianController.updateBranchBook);
router.patch('/books/:id/status', librarianController.updateBranchBookStatus);

// Rentals Management
router.get('/rentals', librarianController.getBranchRentals);
router.post('/rentals', librarianController.createBranchRental);

// Returns Management
router.get('/returns', librarianController.getBranchReturns);
router.post('/returns/:id', librarianController.processBranchReturn);

// Passenger / User Management
router.get('/passengers', librarianController.getBranchPassengers);
router.get('/passengers/:id', librarianController.getBranchPassengerDetails);

// Connected Libraries Network
router.get('/libraries', librarianController.getConnectedLibraries);

// Branch Analytics & Reports
router.get('/reports', librarianController.getBranchReports);

// Branch & Librarian Profile
router.get('/profile', librarianController.getBranchProfile);

module.exports = router;
