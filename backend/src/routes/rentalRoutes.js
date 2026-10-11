const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');

router.post('/', rentalController.createRental);
router.get('/user/:userId', rentalController.getRentalsByUser);
router.get('/:id', rentalController.getRentalById);

module.exports = router;
