const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimiter = require('./middlewares/rateLimiter');
const config = require('./config/config');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet());

app.use(rateLimiter);

// CORS configuration
app.use(cors({
  origin: [/^http:\/\/localhost:\d+$/, config.frontendUrl],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// MongoDB connection
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: 'Something went wrong!',
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});

module.exports = app;
