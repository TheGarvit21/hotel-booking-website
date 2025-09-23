const express = require('express');
const { authenticate, optionalAuth } = require('../middlewares/auth');

const router = express.Router();

// Get reviews for a hotel (public)
router.get('/hotel/:hotelId', optionalAuth, (req, res) => {
  res.json({ message: 'Get hotel reviews' });
});

// Get user's reviews
router.get('/user', authenticate, (req, res) => {
  res.json({ message: 'Get user reviews' });
});

// Create new review
router.post('/', authenticate, (req, res) => {
  res.json({ message: 'Create review' });
});

// Update review
router.put('/:id', authenticate, (req, res) => {
  res.json({ message: 'Update review' });
});

// Delete review
router.delete('/:id', authenticate, (req, res) => {
  res.json({ message: 'Delete review' });
});

module.exports = router;
