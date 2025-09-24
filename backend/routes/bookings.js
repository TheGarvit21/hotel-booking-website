const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  getUserBookings,
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  getAllBookings
} = require('../controllers/bookingController');

const router = express.Router();

// Validation middleware for booking creation
const bookingValidation = [
  body('hotelId')
    .isMongoId()
    .withMessage('Valid hotel ID is required'),
  body('checkIn')
    .isISO8601()
    .withMessage('Valid check-in date is required'),
  body('checkOut')
    .isISO8601()
    .withMessage('Valid check-out date is required'),
  body('guests.adults')
    .isInt({ min: 1 })
    .withMessage('At least 1 adult is required'),
  body('guests.children')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Children count must be a non-negative integer'),
  body('rooms')
    .isInt({ min: 1 })
    .withMessage('At least 1 room is required'),
  body('roomType')
    .isIn(['standard', 'deluxe', 'suite', 'presidential'])
    .withMessage('Invalid room type'),
  body('contactInfo.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Contact name must be between 2 and 50 characters'),
  body('contactInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid contact email is required'),
  // Removed phone validation: phone is now optional and not validated
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet', 'cash'])
    .withMessage('Invalid payment method')
];

// Get all bookings (admin only)
router.get('/admin/all', authenticate, requireAdmin, getAllBookings);

// Get user's bookings
router.get('/', authenticate, getUserBookings);

// Create new booking
router.post('/', authenticate, bookingValidation, createBooking);

// Get booking by ID
router.get('/:id', authenticate, getBookingById);

// Update booking
router.put('/:id', authenticate, updateBooking);

// Cancel booking
router.delete('/:id', authenticate, cancelBooking);

module.exports = router;
