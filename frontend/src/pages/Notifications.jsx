import { motion as Motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { deleteNotification, getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../utils/notifications';

const Notifications = () => {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const navigate = useNavigate();

    useEffect(() => {
        const loadUserAndNotifications = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    loadNotifications(currentUser.id);
                } else {
                    navigate('/auth');
                }
            } catch (error) {
                console.error('Error loading user:', error);
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };

        loadUserAndNotifications();
    }, [navigate]);

    const loadNotifications = (userId) => {
        console.log('Loading all notifications for user:', userId);
        const userNotifications = getUserNotifications(userId);
        const sortedNotifications = userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(sortedNotifications);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markNotificationAsRead(notification.id);
            loadNotifications(user.id);
        }
    };

    const handleMarkAllAsRead = () => {
        markAllNotificationsAsRead(user.id);
        loadNotifications(user.id);
    };

    const handleDeleteNotification = (notificationId) => {
        deleteNotification(notificationId);
        loadNotifications(user.id);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'booking_cancelled':
                return '🚫';
            case 'booking_confirmed':
                return '✅';
            case 'refund_processing':
                return '💰';
            default:
                return '📢';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return '#f56565';
            case 'medium':
                return '#ed8936';
            case 'low':
                return '#48bb78';
            default:
                return '#4299e1';
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px 0', minHeight: '100vh' }}>
                <div className="container">
                    <div className="flex-center" style={{ minHeight: '50vh' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                border: '4px solid var(--border-color)',
                                borderTop: '4px solid var(--primary-color)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 20px'
                            }}></div>
                            <p style={{ color: 'var(--text-gray)' }}>Loading notifications...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.read;
        if (filter === 'read') return notification.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div style={{ padding: '40px 0', minHeight: '100vh' }}>
            <div className="container">
                <Motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '40px',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: '36px',
                                fontFamily: 'Playfair Display, serif',
                                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                margin: '0 0 8px 0'
                            }}>
                                All Notifications
                            </h1>
                            <p style={{ color: 'var(--text-gray)', fontSize: '16px', margin: '0' }}>
                                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '14px' }}
                                >
                                    Mark All as Read
                                </button>
                            )}
                            <button
                                onClick={() => navigate(-1)}
                                className="btn btn-primary"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '30px',
                        background: 'var(--bg-card)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <label style={{ color: 'var(--text-light)', fontWeight: '600' }}>Filter:</label>
                        {['all', 'unread', 'read'].map(filterOption => (
                            <button
                                key={filterOption}
                                onClick={() => setFilter(filterOption)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: filter === filterOption ? 'var(--primary-color)' : 'transparent',
                                    color: filter === filterOption ? 'white' : 'var(--text-light)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {filterOption} {filterOption === 'unread' && unreadCount > 0 && `(${unreadCount})`}
                            </button>
                        ))}
                    </div>

                    {/* Notifications List */}
                    {filteredNotifications.length === 0 ? (
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                textAlign: 'center',
                                padding: '60px 40px',
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                                {filter === 'unread' ? '📭' : filter === 'read' ? '📪' : '🔔'}
                            </div>
                            <h3 style={{
                                fontSize: '24px',
                                color: 'var(--text-light)',
                                marginBottom: '12px',
                                fontFamily: 'Playfair Display, serif'
                            }}>
                                No {filter !== 'all' ? filter : ''} notifications
                            </h3>
                            <p style={{ color: 'var(--text-gray)', fontSize: '16px' }}>
                                {filter === 'unread'
                                    ? 'All caught up! No unread notifications.'
                                    : filter === 'read'
                                        ? 'No read notifications found.'
                                        : 'You have no notifications yet.'}
                            </p>
                        </Motion.div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {filteredNotifications.map((notification, index) => (
                                <Motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    onClick={() => handleNotificationClick(notification)}
                                    style={{
                                        padding: '24px',
                                        background: notification.type === 'booking_confirmed'
                                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(34, 197, 94, 0.05))'
                                            : 'var(--bg-card)',
                                        borderRadius: '16px',
                                        border: `2px solid ${!notification.read
                                            ? (notification.type === 'booking_confirmed' ? '#10b981' : getPriorityColor(notification.priority))
                                            : 'var(--border-color)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        boxShadow: notification.type === 'booking_confirmed' && !notification.read
                                            ? '0 8px 24px rgba(16, 185, 129, 0.15)'
                                            : '0 4px 12px rgba(0, 0, 0, 0.05)'
                                    }}
                                    className="notification-card"
                                >
                                    {!notification.read && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: getPriorityColor(notification.priority)
                                        }} />
                                    )}

                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            fontSize: '32px',
                                            flexShrink: 0,
                                            marginTop: '4px'
                                        }}>
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: '8px'
                                            }}>
                                                <h4 style={{
                                                    fontSize: notification.type === 'booking_confirmed' ? '20px' : '18px',
                                                    fontWeight: '700',
                                                    color: notification.type === 'booking_confirmed' ? '#059669' : 'var(--text-light)',
                                                    margin: '0',
                                                    lineHeight: '1.3',
                                                    textShadow: notification.type === 'booking_confirmed' ? '0 1px 2px rgba(16, 185, 129, 0.1)' : 'none'
                                                }}>
                                                    {notification.title}
                                                </h4>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteNotification(notification.id);
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--text-gray)',
                                                        cursor: 'pointer',
                                                        fontSize: '20px',
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    title="Delete notification"
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            <p style={{
                                                color: 'var(--text-gray)',
                                                fontSize: '15px',
                                                lineHeight: '1.5',
                                                margin: '0 0 12px 0',
                                                whiteSpace: 'pre-line'
                                            }}>
                                                {notification.message}
                                            </p>

                                            {notification.type === 'booking_confirmed' && (
                                                <div style={{
                                                    marginBottom: '16px',
                                                    padding: '20px',
                                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(34, 197, 94, 0.08))',
                                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                                    borderRadius: '16px',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}>
                                                    {/* Decorative elements */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-20px',
                                                        right: '-20px',
                                                        width: '80px',
                                                        height: '80px',
                                                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent)',
                                                        borderRadius: '50%'
                                                    }} />

                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        marginBottom: '16px',
                                                        position: 'relative',
                                                        zIndex: 1
                                                    }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '12px',
                                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '20px',
                                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                                        }}>
                                                            🏨
                                                        </div>
                                                        <div>
                                                            <h4 style={{
                                                                margin: 0,
                                                                color: '#059669',
                                                                fontSize: '16px',
                                                                fontWeight: '600'
                                                            }}>
                                                                Your Trip Details
                                                            </h4>
                                                            <p style={{
                                                                margin: 0,
                                                                color: '#6b7280',
                                                                fontSize: '13px'
                                                            }}>
                                                                Everything you need to know
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Flowing content layout */}
                                                    <div style={{
                                                        color: '#374151',
                                                        lineHeight: '1.6',
                                                        fontSize: '15px',
                                                        position: 'relative',
                                                        zIndex: 1
                                                    }}>
                                                        {notification.hotelName && (
                                                            <p style={{ margin: '0 0 8px 0' }}>
                                                                <span style={{ color: '#6b7280' }}>You're all set for</span>{' '}
                                                                <strong style={{ color: '#059669' }}>{notification.hotelName}</strong>
                                                                {notification.hotelLocation && (
                                                                    <span style={{ color: '#6b7280' }}> in {notification.hotelLocation}</span>
                                                                )}
                                                            </p>
                                                        )}

                                                        {notification.checkIn && notification.checkOut && (
                                                            <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '16px' }}>📅</span>
                                                                <span style={{ color: '#6b7280' }}>
                                                                    {new Date(notification.checkIn).toLocaleDateString('en-US', {
                                                                        weekday: 'short',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </span>
                                                                <span style={{ color: '#059669', fontWeight: '500' }}>→</span>
                                                                <span style={{ color: '#6b7280' }}>
                                                                    {new Date(notification.checkOut).toLocaleDateString('en-US', {
                                                                        weekday: 'short',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </span>
                                                                {notification.nights && (
                                                                    <span style={{
                                                                        marginLeft: '8px',
                                                                        padding: '2px 8px',
                                                                        background: 'rgba(16, 185, 129, 0.15)',
                                                                        borderRadius: '12px',
                                                                        fontSize: '12px',
                                                                        color: '#059669',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {notification.nights} night{notification.nights !== 1 ? 's' : ''}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}

                                                        {notification.guests && (
                                                            <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '16px' }}>👥</span>
                                                                <span style={{ color: '#6b7280' }}>
                                                                    {notification.guests} guest{notification.guests !== '1' ? 's' : ''}
                                                                </span>
                                                            </p>
                                                        )}

                                                        {notification.bookingId && (
                                                            <div style={{
                                                                marginTop: '16px',
                                                                padding: '12px',
                                                                background: 'rgba(255, 255, 255, 0.7)',
                                                                borderRadius: '12px',
                                                                borderLeft: '4px solid #10b981'
                                                            }}>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontSize: '12px',
                                                                    color: '#6b7280'
                                                                }}>
                                                                    <strong style={{ color: '#374151' }}>Confirmation:</strong>{' '}
                                                                    <code style={{
                                                                        background: '#f3f4f6',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        fontFamily: 'monospace',
                                                                        fontSize: '11px'
                                                                    }}>
                                                                        {notification.bookingId}
                                                                    </code>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action buttons with natural spacing */}
                                                    <div style={{
                                                        marginTop: '20px',
                                                        display: 'flex',
                                                        gap: '12px',
                                                        flexWrap: 'wrap',
                                                        position: 'relative',
                                                        zIndex: 1
                                                    }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate('/bookings');
                                                            }}
                                                            style={{
                                                                padding: '10px 18px',
                                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                fontSize: '14px',
                                                                fontWeight: '500',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.transform = 'translateY(-2px)';
                                                                e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.35)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'translateY(0)';
                                                                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                                                            }}
                                                        >
                                                            <span>📋</span> Manage Booking
                                                        </button>
                                                        {notification.hotelName && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/hotel/${encodeURIComponent(notification.hotelName)}`);
                                                                }}
                                                                style={{
                                                                    padding: '10px 18px',
                                                                    background: 'rgba(255, 255, 255, 0.9)',
                                                                    color: '#059669',
                                                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                                                    borderRadius: '10px',
                                                                    fontSize: '14px',
                                                                    fontWeight: '500',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.3s ease',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                                                                    e.target.style.borderColor = '#10b981';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                                                                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                                                                }}
                                                            >
                                                                <span>🏨</span> View Hotel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {notification.type === 'booking_cancelled' && notification.refundInstructions && (
                                                <div style={{
                                                    marginBottom: '12px',
                                                    padding: '12px',
                                                    background: 'rgba(34, 197, 94, 0.1)',
                                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    color: '#15803d'
                                                }}>
                                                    <strong>💡 Refund Information:</strong><br />
                                                    {notification.refundInstructions}
                                                </div>
                                            )}

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '13px',
                                                color: 'var(--text-gray)'
                                            }}>
                                                <span>{formatTime(notification.timestamp)}</span>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    {notification.priority && (
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            background: getPriorityColor(notification.priority),
                                                            color: 'white',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {notification.priority}
                                                        </span>
                                                    )}
                                                    {!notification.read && (
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            background: 'var(--primary-color)',
                                                            color: 'white',
                                                            fontSize: '11px',
                                                            fontWeight: '600'
                                                        }}>
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Motion.div>
                            ))}
                        </div>
                    )}
                </Motion.div>
            </div>

            <style jsx>{`
                .notification-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Notifications;
