const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST /api/payments/create-order - Create Razorpay order (Backend pricing enforcement)
router.post('/create-order', paymentController.createOrder);

// POST /api/payments/verify - Verify Razorpay payment signature & capture status
router.post('/verify', paymentController.verifyPayment);

// POST /api/payments/webhook - Asynchronous webhook event listener
router.post('/webhook', paymentController.handleWebhook);

// POST /api/payments/process - Preserved legacy/simulated transaction endpoint
router.post('/process', paymentController.processPayment);

module.exports = router;
