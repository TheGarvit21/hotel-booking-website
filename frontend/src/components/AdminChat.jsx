import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../utils/auth';
import './AdminChat.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const AdminChat = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const token = getAccessToken();

        if (!token) {
            return;
        }

        // Connect to Socket.IO server
        const socket = io(API_BASE, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            // Request chat list
            socket.emit('get_chats');
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setConnected(false);
        });

        socket.on('chats_list', (data) => {
            if (Array.isArray(data)) {
                setChats(data);
                const totalUnread = data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
                setUnreadCount(totalUnread);
            }
        });

        socket.on('new_user_message', (data) => {
            // Helper to normalize userId for comparison
            const normalizeUserId = (id) => {
                if (!id) return null;
                return typeof id === 'object' && id._id ? id._id.toString() : id.toString();
            };

            const dataUserId = normalizeUserId(data.userId);

            // Update chat list
            setChats((prevChats) => {
                const updatedChats = prevChats.map(chat => {
                    const chatUserId = normalizeUserId(chat.userId);
                    if (chatUserId === dataUserId) {
                        return {
                            ...chat,
                            lastMessage: data.message,
                            lastMessageTime: data.timestamp,
                            unreadCount: (chat.unreadCount || 0) + 1
                        };
                    }
                    return chat;
                });

                // If chat doesn't exist, add it
                const chatExists = updatedChats.some(chat => {
                    const chatUserId = normalizeUserId(chat.userId);
                    return chatUserId === dataUserId;
                });

                if (!chatExists) {
                    updatedChats.unshift({
                        userId: data.userId,
                        userName: data.userName,
                        userEmail: data.userEmail,
                        lastMessage: data.message,
                        lastMessageTime: data.timestamp,
                        unreadCount: 1,
                        messages: []
                    });
                }

                // Sort by last message time
                return updatedChats.sort((a, b) => 
                    new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
                );
            });

            // Update unread count
            setUnreadCount((prev) => prev + 1);

            // If this is the selected chat, add message to messages
            if (selectedChat) {
                const selectedUserId = normalizeUserId(selectedChat.userId);
                if (selectedUserId === dataUserId) {
                    setMessages((prev) => [...prev, {
                        id: Date.now(),
                        sender: 'user',
                        message: data.message,
                        timestamp: data.timestamp,
                        userId: data.userId,
                        userName: data.userName
                    }]);
                    // Mark as read
                    socket.emit('mark_read', { userId: data.userId });
                }
            }
        });

        socket.on('admin_message_sent', (data) => {
            // Helper to normalize userId for comparison
            const normalizeUserId = (id) => {
                if (!id) return null;
                return typeof id === 'object' && id._id ? id._id.toString() : id.toString();
            };

            // Update messages if this is the selected chat
            if (selectedChat) {
                const selectedUserId = normalizeUserId(selectedChat.userId);
                const dataUserId = normalizeUserId(data.userId);
                if (selectedUserId === dataUserId) {
                    setMessages((prev) => [...prev, {
                        id: Date.now(),
                        sender: 'admin',
                        message: data.message,
                        timestamp: data.timestamp
                    }]);
                }
            }
        });

        socket.on('messages_read', (data) => {
            // Helper to normalize userId for comparison
            const normalizeUserId = (id) => {
                if (!id) return null;
                return typeof id === 'object' && id._id ? id._id.toString() : id.toString();
            };

            const dataUserId = normalizeUserId(data.userId);

            // Update unread count
            setChats((prevChats) => {
                return prevChats.map(chat => {
                    const chatUserId = normalizeUserId(chat.userId);
                    if (chatUserId === dataUserId) {
                        return { ...chat, unreadCount: 0 };
                    }
                    return chat;
                });
            });
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [selectedChat]);

    const normalizeUserId = (id) => {
        if (!id) return null;
        return typeof id === 'object' && id._id ? id._id.toString() : id.toString();
    };

    const handleSelectChat = async (chat) => {
        setSelectedChat(chat);
        
        // Load messages for this chat
        if (chat.messages && chat.messages.length > 0) {
            const formattedMessages = chat.messages.map(msg => ({
                id: msg._id || Date.now() + Math.random(),
                sender: msg.sender,
                message: msg.message,
                timestamp: msg.timestamp
            }));
            setMessages(formattedMessages);
        } else {
            setMessages([]);
        }

        // Mark as read
        if (socketRef.current && (chat.unreadCount > 0)) {
            const userId = chat.userId?._id || chat.userId;
            socketRef.current.emit('mark_read', { userId });
        }
    };

    const sendMessage = () => {
        if (input.trim() && socketRef.current && connected && selectedChat) {
            const userId = selectedChat.userId?._id || selectedChat.userId;
            socketRef.current.emit('admin_message', {
                userId: userId,
                message: input.trim()
            });
            setInput('');
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="admin-chat-container">
            <div className="admin-chat-sidebar">
                <div className="admin-chat-header">
                    <h2>Chats</h2>
                    {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount}</span>
                    )}
                </div>
                <div className="chat-list">
                    {chats.length === 0 ? (
                        <div className="empty-chats">
                            <p>No active chats</p>
                        </div>
                    ) : (
                        chats.map((chat) => {
                            const userId = chat.userId?._id || chat.userId;
                            const userName = chat.userName || chat.userId?.name || 'Unknown User';
                            const selectedUserId = selectedChat ? normalizeUserId(selectedChat.userId) : null;
                            const chatUserId = normalizeUserId(chat.userId);
                            const isSelected = selectedUserId === chatUserId;
                            
                            return (
                                <div
                                    key={userId}
                                    className={`chat-item ${isSelected ? 'selected' : ''} ${chat.unreadCount > 0 ? 'unread' : ''}`}
                                    onClick={() => handleSelectChat(chat)}
                                >
                                    <div className="chat-avatar">
                                        {getInitials(userName)}
                                    </div>
                                    <div className="chat-info">
                                        <div className="chat-name-row">
                                            <span className="chat-name">{userName}</span>
                                            {chat.lastMessageTime && (
                                                <span className="chat-time">
                                                    {formatTime(chat.lastMessageTime)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="chat-preview-row">
                                            <span className="chat-preview">
                                                {chat.lastMessage || 'No messages yet'}
                                            </span>
                                            {chat.unreadCount > 0 && (
                                                <span className="chat-unread-count">{chat.unreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="admin-chat-main">
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">
                                    {getInitials(selectedChat.userName || selectedChat.userId?.name || 'Unknown')}
                                </div>
                                <div>
                                    <h3>{selectedChat.userName || selectedChat.userId?.name || 'Unknown User'}</h3>
                                    <p className="chat-email">
                                        {selectedChat.userEmail || selectedChat.userId?.email || ''}
                                    </p>
                                </div>
                            </div>
                            <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
                                {connected ? '🟢' : '🔴'}
                            </div>
                        </div>

                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="empty-messages">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.sender === 'admin' ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-content">
                                            {msg.message}
                                        </div>
                                        <div className="message-time">
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-container">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Type a message..."
                                disabled={!connected}
                                className="chat-input"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!connected || !input.trim()}
                                className="send-button"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="no-chat-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                            </svg>
                        </div>
                        <h3>Select a chat to start messaging</h3>
                        <p>Choose a conversation from the list to view and reply to messages</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;

