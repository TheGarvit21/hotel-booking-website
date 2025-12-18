const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mailer = require('../utils/mailer');

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      sortBy = 'bookingDate',
      sortOrder = 'desc'
    } = req.query;

    const filter = { user: req.user.id };
    if (status !== 'all') filter.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filter)
      .populate('hotel', 'name location city rating images')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    // Attach hotelName and hotelLocation for each booking to match frontend expectations
    const bookingsWithDetails = bookings.map(b => {
      const obj = b.toObject();
      obj.hotelName = b.hotel?.name || '';
      obj.hotelLocation = b.hotel?.location || '';
      obj.hotelImage = (b.hotel?.images && b.hotel.images.length > 0) ? b.hotel.images[0] : (b.hotel?.image || obj.hotelImage || '');
      return obj;
    });

    res.json({
      success: true,
      data: bookingsWithDetails,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      hotelId,
      checkIn,
      checkOut,
      guests,
      rooms,
      roomType,
      specialRequests,
      contactInfo,
      paymentMethod
    } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    if (!hotel.available) {
      return res.status(400).json({
        success: false,
        message: 'Hotel is not available for booking'
      });
    }

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const nightly = hotel.price || 0;
    const basePrice = nightly * nights * (rooms || 1);
    const serviceFee = Math.round(basePrice * 0.10);
    const taxes = Math.round(basePrice * 0.12);
    const totalPrice = basePrice + serviceFee + taxes;
    const hotelImage =
      Array.isArray(hotel.images) && hotel.images.length > 0
        ? hotel.images[0]
        : hotel.image || '';

    const booking = new Booking({
      user: req.user.id,
      hotel: hotelId,
      hotelImage,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: {
        adults: guests?.adults || 1,
        children: guests?.children || 0
      },
      rooms: rooms || 1,
      roomType: roomType || 'standard',
      basePrice,
      serviceFee,
      taxes,
      totalPrice,
      pricePerNight: nightly,
      currency: hotel.currency || 'INR',
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'credit_card',
      specialRequests: specialRequests || '',
      contactInfo: {
        name: contactInfo?.name || req.user.name,
        email: contactInfo?.email || req.user.email,
        phone: contactInfo?.phone || ''
      }
    });

    await booking.save();
    await booking.populate('hotel', 'name location city rating images price image');

    // Send booking confirmation email (best-effort, non-blocking)
    mailer.sendMail({
      to: booking.contactInfo?.email || req.user.email,
      subject: 'Booking Confirmation',
      html: `<p>Hi ${booking.contactInfo?.name || ''},</p><p>Your booking at ${booking.hotel?.name || ''} is confirmed.</p><p>Confirmation: ${booking.confirmationNumber || booking._id}</p>`
    }).catch(err => {
      console.error('Failed to send booking confirmation email:', err.message);
      // Non-fatal: continue with response even if email fails
    });

    let hotelImageResp = booking.hotelImage;
    if (!hotelImageResp && booking.hotel?.images?.length > 0) {
      hotelImageResp = booking.hotel.images[0];
    } else if (!hotelImageResp && booking.hotel?.image) {
      hotelImageResp = booking.hotel.image;
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        ...booking.toObject(),
        hotelImage: hotelImageResp,
        price: booking.pricePerNight,
        basePrice: booking.basePrice,
        serviceFee: booking.serviceFee,
        taxes: booking.taxes,
        hotelName: hotel.name,
        hotelLocation: hotel.location
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};



// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hotel', 'name location city rating images')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = ['specialRequests', 'contactInfo', 'paymentMethod'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Admin can update status
    if (req.user.role === 'admin' && req.body.status) {
      updates.status = req.body.status;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('hotel', 'name location city rating images');

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    await booking.populate('hotel', 'name location city rating images');

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      hotelId,
      userId,
      sortBy = 'bookingDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status !== 'all') {
      filter.status = status;
    }

    if (hotelId) {
      filter.hotel = hotelId;
    }

    if (userId) {
      filter.user = userId;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get bookings with hotel and user details
    const bookings = await Booking.find(filter)
      .populate('hotel', 'name location city rating')
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Booking.countDocuments(filter);
    // Attach hotelName and hotelLocation for each booking
    const bookingsWithHotelDetails = bookings.map(b => {
      const obj = b.toObject();
      obj.hotelName = b.hotel?.name || '';
      obj.hotelLocation = b.hotel?.location || '';
      obj.hotelImage = (b.hotel?.images && b.hotel.images.length > 0) ? b.hotel.images[0] : (b.hotel?.image || obj.hotelImage || '');
      return obj;
    });

    res.json({
      success: true,
      data: bookingsWithHotelDetails,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

module.exports = {
  getUserBookings,
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  getAllBookings
};
