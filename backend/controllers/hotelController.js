const Hotel = require('../models/Hotel');
const { validationResult } = require('express-validator');


const getAllHotels = async (req, res) => {
  try {
    const {
      city,
      state,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      featured,
      category,
      status = 'active',
      page = 1,
      limit = 20,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status, available: true };

    if (city) {
      filter.city = new RegExp(city, 'i');
    }

    if (state) {
      filter.state = new RegExp(state, 'i');
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = Number(minRating);
      if (maxRating) filter.rating.$lte = Number(maxRating);
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (category) {
      filter.category = category;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const hotels = await Hotel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name email')
      .lean();

    const total = await Hotel.countDocuments(filter);

    res.json({
      success: true,
      data: hotels,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hotels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hotel',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Private (Admin only)
const createHotel = async (req, res) => {
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

    const {
      name,
      location,
      city,
      state,
      country = 'India',
      landmark,
      rating = 4.0,
      price,
      currency = 'INR',
      description,
      amenities = [],
      images = [],
      image,
      roomTypes = []
    } = req.body;

    // Check if hotel with same name in same city already exists
    const existingHotel = await Hotel.findOne({
      name: new RegExp(`^${name}$`, 'i'),
      city: new RegExp(`^${city}$`, 'i')
    });

    if (existingHotel) {
      return res.status(400).json({
        success: false,
        message: 'Hotel with this name already exists in the same city'
      });
    }

    // Create hotel data
    const hotelData = {
      name: name.trim(),
      location: location.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      landmark: landmark?.trim(),
      rating: Number(rating),
      price: Number(price),
      currency,
      description: description.trim(),
      amenities: Array.isArray(amenities) ? amenities.filter(a => a.trim()) : [],
      images: Array.isArray(images) ? images.filter(img => img.trim()) : [],
      image: image?.trim(),
      roomTypes: Array.isArray(roomTypes) ? roomTypes : [],
      createdBy: req.user?.id
    };

    // Set main image if not provided
    if (!hotelData.image && hotelData.images.length > 0) {
      hotelData.image = hotelData.images[0];
    }

    const hotel = new Hotel(hotelData);
    await hotel.save();

    // Populate the created hotel
    const populatedHotel = await Hotel.findById(hotel._id)
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: populatedHotel
    });
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating hotel',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private (Admin only)
const updateHotel = async (req, res) => {
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

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    const {
      name,
      location,
      city,
      state,
      country,
      landmark,
      rating,
      price,
      currency,
      description,
      amenities,
      images,
      image,
      roomTypes,
      status,
      available,
      featured
    } = req.body;

    // Check if hotel with same name in same city already exists (excluding current hotel)
    if (name && city) {
      const existingHotel = await Hotel.findOne({
        name: new RegExp(`^${name}$`, 'i'),
        city: new RegExp(`^${city}$`, 'i'),
        _id: { $ne: req.params.id }
      });

      if (existingHotel) {
        return res.status(400).json({
          success: false,
          message: 'Hotel with this name already exists in the same city'
        });
      }
    }

    // Update fields
    if (name !== undefined) hotel.name = name.trim();
    if (location !== undefined) hotel.location = location.trim();
    if (city !== undefined) hotel.city = city.trim();
    if (state !== undefined) hotel.state = state.trim();
    if (country !== undefined) hotel.country = country.trim();
    if (landmark !== undefined) hotel.landmark = landmark?.trim();
    if (rating !== undefined) hotel.rating = Number(rating);
    if (price !== undefined) hotel.price = Number(price);
    if (currency !== undefined) hotel.currency = currency;
    if (description !== undefined) hotel.description = description.trim();
    if (amenities !== undefined) hotel.amenities = Array.isArray(amenities) ? amenities.filter(a => a.trim()) : [];
    if (images !== undefined) hotel.images = Array.isArray(images) ? images.filter(img => img.trim()) : [];
    if (image !== undefined) hotel.image = image?.trim();
    if (roomTypes !== undefined) hotel.roomTypes = Array.isArray(roomTypes) ? roomTypes : [];
    if (status !== undefined) hotel.status = status;
    if (available !== undefined) hotel.available = available;
    if (featured !== undefined) hotel.featured = featured;

    // Set main image if not provided but images array has items
    if (!hotel.image && hotel.images.length > 0) {
      hotel.image = hotel.images[0];
    }

    await hotel.save();

    // Populate the updated hotel
    const populatedHotel = await Hotel.findById(hotel._id)
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      data: populatedHotel
    });
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating hotel',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private (Admin only)
const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    await Hotel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Hotel deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting hotel',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getHotelsByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const { limit = 10 } = req.query;

    const hotels = await Hotel.find({
      city: new RegExp(city, 'i'),
      status: 'active',
      available: true
    })
    .sort({ rating: -1 })
    .limit(Number(limit))
    .populate('createdBy', 'name email')
    .lean();

    res.json({
      success: true,
      data: hotels,
      count: hotels.length
    });
  } catch (error) {
    console.error('Error fetching hotels by city:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hotels by city',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const getFeaturedHotels = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const hotels = await Hotel.find({
      featured: true,
      status: 'active',
      available: true
    })
    .sort({ rating: -1 })
    .limit(Number(limit))
    .populate('createdBy', 'name email')
    .lean();

    res.json({
      success: true,
      data: hotels,
      count: hotels.length
    });
  } catch (error) {
    console.error('Error fetching featured hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured hotels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const searchHotels = async (req, res) => {
  try {
    const { q, city, limit = 20 } = req.query;

    if (!q && !city) {
      return res.status(400).json({
        success: false,
        message: 'Search query or city is required'
      });
    }

    const filter = {
      status: 'active',
      available: true
    };

    if (city) {
      filter.city = new RegExp(city, 'i');
    }

    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') },
        { state: new RegExp(q, 'i') },
        { landmark: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') }
      ];
    }

    const hotels = await Hotel.find(filter)
      .sort({ rating: -1 })
      .limit(Number(limit))
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: hotels,
      count: hotels.length
    });
  } catch (error) {
    console.error('Error searching hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching hotels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelsByCity,
  getFeaturedHotels,
  searchHotels
};
