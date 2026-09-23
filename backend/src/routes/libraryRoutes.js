const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');

router.get('/', libraryController.getAllLibraries);
router.get('/:id', libraryController.getLibraryById);

module.exports = router;
