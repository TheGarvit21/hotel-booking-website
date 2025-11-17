const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const chatController = require('../controllers/chatController');

// Get all chats (admin only)
router.get('/admin/chats', authenticate, requireAdmin, async (req, res) => {
  try {
    const chats = await chatController.getAllChats();
    res.json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get chat by userId
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only access their own chat, admins can access any
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }
    
    const chat = await chatController.getChatByUserId(userId);
    if (!chat) {
      return res.json({ success: true, data: { messages: [] } });
    }
    res.json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Mark messages as read
router.put('/:userId/read', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only admin can mark messages as read
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }
    
    const chat = await chatController.markAsRead(userId);
    res.json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Get unread count (admin only)
router.get('/admin/unread-count', authenticate, requireAdmin, async (req, res) => {
  try {
    const count = await chatController.getUnreadCount();
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;

