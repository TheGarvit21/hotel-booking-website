const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, (req, res) => {
  res.json({ message: 'Get all users - Admin only' });
});

// Get user by ID (admin or own profile)
router.get('/:id', authenticate, (req, res) => {
  res.json({ message: 'Get user by ID' });
});

// Update user (admin or own profile)
router.put('/:id', authenticate, (req, res) => {
  res.json({ message: 'Update user' });
});

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  res.json({ message: 'Delete user - Admin only' });
});

module.exports = router;
