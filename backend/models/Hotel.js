const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true,
    maxlength: [100, 'Hotel name cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State name cannot exceed 50 characters']
  },
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  landmark: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 4.0
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    trim: true
  },
  roomTypes: [{
    type: mongoose.Schema.Types.Mixed
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  available: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['Luxury', 'Premium', 'Comfort', 'Budget'],
    default: 'Comfort'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
hotelSchema.index({ city: 1 });
hotelSchema.index({ state: 1 });
hotelSchema.index({ rating: -1 });
hotelSchema.index({ price: 1 });
hotelSchema.index({ featured: 1 });
hotelSchema.index({ status: 1 });
hotelSchema.index({ available: 1 });

// Virtual for full location
hotelSchema.virtual('fullLocation').get(function() {
  return `${this.landmark ? this.landmark + ', ' : ''}${this.city}, ${this.state}`;
});

// Method to get hotel without sensitive data
hotelSchema.methods.toSafeObject = function() {
  const hotelObject = this.toObject();
  return hotelObject;
};

// Static method to find hotels by city
hotelSchema.statics.findByCity = function(city) {
  return this.find({ 
    city: new RegExp(city, 'i'), 
    status: 'active',
    available: true 
  });
};

// Static method to find featured hotels
hotelSchema.statics.findFeatured = function() {
  return this.find({ 
    featured: true, 
    status: 'active',
    available: true 
  }).sort({ rating: -1 });
};

// Pre-save middleware to set category based on rating
hotelSchema.pre('save', function(next) {
  if (this.rating >= 4.5) {
    this.category = 'Luxury';
  } else if (this.rating >= 4.0) {
    this.category = 'Premium';
  } else if (this.rating >= 3.0) {
    this.category = 'Comfort';
  } else {
    this.category = 'Budget';
  }
  
  // Set featured based on rating
  this.featured = this.rating >= 4.3;
  
  next();
});

// Ensure virtual fields are serialized
hotelSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

module.exports = mongoose.model('Hotel', hotelSchema);
