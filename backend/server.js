const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const rateLimiter = require('./middlewares/rateLimiter');
const { verifyToken } = require('./utils/jwt');
const User = require('./models/User');
const chatController = require('./controllers/chatController');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

const PORT = config.port;

// CORS configuration - must be before other middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests explicitly
app.options('*', cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// app.use(rateLimiter);

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
app.use('/api/chat', chatRoutes);

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

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.userName = user.name || user.email.split('@')[0];
    socket.userEmail = user.email;
    socket.userRole = user.role || 'user';

    next();
  } catch (error) {
    next(new Error('Authentication error: ' + error.message));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userName} (${socket.userId})`);

  // Join user's personal room
  socket.join(`user_${socket.userId}`);

  // If admin, join admin room
  if (socket.userRole === 'admin') {
    socket.join('admin_room');
    console.log(`Admin connected: ${socket.userName}`);
  }

  // Handle user sending message
  socket.on('user_message', async (data) => {
    try {
      const { message } = data;

      if (!message || !message.trim()) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      // Save message to database
      const result = await chatController.addMessage(
        socket.userId,
        socket.userName,
        socket.userEmail,
        message.trim(),
        'user'
      );

      // Emit to user's own room
      io.to(`user_${socket.userId}`).emit('new_message', {
        userId: socket.userId,
        userName: socket.userName,
        message: result.message.message,
        sender: 'user',
        timestamp: result.message.timestamp
      });

      // Notify admin room
      io.to('admin_room').emit('new_user_message', {
        userId: socket.userId,
        userName: socket.userName,
        userEmail: socket.userEmail,
        message: result.message.message,
        timestamp: result.message.timestamp,
        unreadCount: result.chat.unreadCount
      });
    } catch (error) {
      console.error('Error handling user message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle admin sending message
  socket.on('admin_message', async (data) => {
    try {
      if (socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }

      const { userId, message } = data;

      if (!userId || !message || !message.trim()) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Get user info
      const user = await User.findById(userId).select('name email');
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Save message to database
      const result = await chatController.addMessage(
        userId,
        user.name || user.email.split('@')[0],
        user.email,
        message.trim(),
        'admin'
      );

      // Mark as read
      await chatController.markAsRead(userId);

      // Emit to user's room
      io.to(`user_${userId}`).emit('new_message', {
        userId: userId,
        userName: user.name || user.email.split('@')[0],
        message: result.message.message,
        sender: 'admin',
        timestamp: result.message.timestamp
      });

      // Emit to admin room
      io.to('admin_room').emit('admin_message_sent', {
        userId: userId,
        message: result.message.message,
        timestamp: result.message.timestamp
      });
    } catch (error) {
      console.error('Error handling admin message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle admin requesting chat list
  socket.on('get_chats', async () => {
    try {
      if (socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }

      const chats = await chatController.getAllChats();
      socket.emit('chats_list', chats);
    } catch (error) {
      console.error('Error getting chats:', error);
      socket.emit('error', { message: 'Failed to get chats' });
    }
  });

  // Handle user requesting their chat history
  socket.on('get_chat_history', async () => {
    try {
      const chat = await chatController.getChatByUserId(socket.userId);
      socket.emit('chat_history', chat || { messages: [] });
    } catch (error) {
      console.error('Error getting chat history:', error);
      socket.emit('error', { message: 'Failed to get chat history' });
    }
  });

  // Handle admin marking messages as read
  socket.on('mark_read', async (data) => {
    try {
      if (socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }

      const { userId } = data;
      await chatController.markAsRead(userId);

      // Notify admin room
      io.to('admin_room').emit('messages_read', { userId });
    } catch (error) {
      console.error('Error marking as read:', error);
      socket.emit('error', { message: 'Failed to mark as read' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userName} (${socket.userId})`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log(`WebSocket server ready`);
});

module.exports = { app, server, io };
