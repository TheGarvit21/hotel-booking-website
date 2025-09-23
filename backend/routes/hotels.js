const express = require('express');
const { body } = require('express-validator');
const { optionalAuth, requireAuth, requireAdmin } = require('../middlewares/auth');
const {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelsByCity,
  getFeaturedHotels,
  searchHotels
} = require('../controllers/hotelController');

const router = express.Router();

// Validation middleware
const hotelValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hotel name must be between 2 and 100 characters'),
  body('location')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Location must be between 5 and 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('price')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR'])
    .withMessage('Currency must be USD, EUR, GBP, or INR'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
];

// Public routes
router.get('/', optionalAuth, getAllHotels);
router.get('/featured', optionalAuth, getFeaturedHotels);
router.get('/search', optionalAuth, searchHotels);
router.get('/city/:city', optionalAuth, getHotelsByCity);
router.get('/:id', optionalAuth, getHotelById);

// Protected routes (Admin only)
router.post('/', requireAuth, requireAdmin, hotelValidation, createHotel);
router.put('/:id', requireAuth, requireAdmin, hotelValidation, updateHotel);
router.delete('/:id', requireAuth, requireAdmin, deleteHotel);

module.exports = router;
