const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// DELETE /api/reviews/:id - Delete a review by id
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router; 