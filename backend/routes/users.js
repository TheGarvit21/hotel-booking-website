const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

// Admin routes
router.get('/', authenticate, requireAdmin, getAllUsers);
router.post('/', authenticate, requireAdmin, createUser);
router.get('/stats', authenticate, requireAdmin, getUserStats);
router.get('/:id', authenticate, requireAdmin, getUserById);
router.put('/:id', authenticate, requireAdmin, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

module.exports = router;
