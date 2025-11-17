const Chat = require('../models/Chat');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper to convert userId to ObjectId
const toObjectId = (userId) => {
  if (mongoose.Types.ObjectId.isValid(userId)) {
    return new mongoose.Types.ObjectId(userId);
  }
  return userId;
};

// Get or create chat for a user
const getOrCreateChat = async (userId, userName, userEmail) => {
  const userIdObj = toObjectId(userId);
  let chat = await Chat.findOne({ userId: userIdObj });
  
  if (!chat) {
    chat = new Chat({
      userId: userIdObj,
      userName,
      userEmail,
      messages: []
    });
    await chat.save();
  }
  
  return chat;
};

// Add message to chat
const addMessage = async (userId, userName, userEmail, message, sender) => {
  const chat = await getOrCreateChat(userId, userName, userEmail);
  
  const newMessage = {
    userId,
    userName,
    userEmail,
    message,
    sender,
    timestamp: new Date()
  };
  
  chat.messages.push(newMessage);
  chat.lastMessage = message;
  chat.lastMessageTime = new Date();
  
  if (sender === 'user') {
    chat.unreadCount += 1;
  } else {
    // Admin replied, reset unread count
    chat.unreadCount = 0;
  }
  
  await chat.save();
  return { chat, message: newMessage };
};

// Get all chats for admin
const getAllChats = async () => {
  return await Chat.find({ isActive: true })
    .sort({ lastMessageTime: -1 })
    .populate('userId', 'name email')
    .lean();
};

// Get chat by userId
const getChatByUserId = async (userId) => {
  const userIdObj = toObjectId(userId);
  return await Chat.findOne({ userId: userIdObj })
    .populate('userId', 'name email')
    .lean();
};

// Mark messages as read
const markAsRead = async (userId) => {
  const userIdObj = toObjectId(userId);
  const chat = await Chat.findOne({ userId: userIdObj });
  if (chat) {
    chat.unreadCount = 0;
    chat.messages.forEach(msg => {
      if (msg.sender === 'user') {
        msg.read = true;
      }
    });
    await chat.save();
  }
  return chat;
};

// Get unread count for admin
const getUnreadCount = async () => {
  const chats = await Chat.find({ isActive: true });
  return chats.reduce((total, chat) => total + chat.unreadCount, 0);
};

module.exports = {
  getOrCreateChat,
  addMessage,
  getAllChats,
  getChatByUserId,
  markAsRead,
  getUnreadCount
};

