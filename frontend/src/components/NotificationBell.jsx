import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { getUnreadNotificationCount, getUserNotifications, markNotificationAsRead } from '../utils/notifications';
import './NotificationBell.css';

const NotificationBell = () => {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUserAndNotifications = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    loadNotifications(currentUser.id);
                }
            } catch (error) {
                // Error loading user
            }
        };

        loadUserAndNotifications();

        // Listen for auth changes
        const handleAuthChange = (e) => {
            const updatedUser = e?.detail?.user;
            if (updatedUser) {
                setUser(updatedUser);
                loadNotifications(updatedUser.id);
            } else {
                setUser(null);
                setNotifications([]);
                setUnreadCount(0);
            }
        };

        // Listen for booking cancellation events
        const handleBookingCancelled = (e) => {
            const { userId } = e.detail;
            // Reload notifications if this cancellation affects the current user
            if (user && userId === user.id) {
                // NotificationBell: Booking cancelled for current user, reloading notifications
                loadNotifications(user.id);
            }
        };

        // Listen for general notification updates
        const handleNotificationUpdate = () => {
            if (user) {
                // NotificationBell: Notification updated, reloading
                loadNotifications(user.id);
            }
        };

        window.addEventListener('auth:change', handleAuthChange);
        window.addEventListener('booking:cancelled', handleBookingCancelled);
        window.addEventListener('notification:updated', handleNotificationUpdate);

        return () => {
            window.removeEventListener('auth:change', handleAuthChange);
            window.removeEventListener('booking:cancelled', handleBookingCancelled);
            window.removeEventListener('notification:updated', handleNotificationUpdate);
        };
    }, [user]);

    const loadNotifications = (userId) => {
        // NotificationBell: Loading notifications for user
        const userNotifications = getUserNotifications(userId);
        // NotificationBell: Found notifications

        // Only show unread notifications in the bell dropdown
        const unreadNotifications = userNotifications.filter(notification => !notification.read);
        const sortedNotifications = unreadNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(sortedNotifications.slice(0, 10)); // Show only latest 10 unread

        const unreadCount = getUnreadNotificationCount(userId);
        // NotificationBell: Unread count
        setUnreadCount(unreadCount);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markNotificationAsRead(notification.id);
            loadNotifications(user.id);
        }
    };

    const handleViewAllNotifications = () => {
        setShowDropdown(false);
        navigate('/notifications');
    };

    const handleDismissNotification = (notificationId, e) => {
        e.stopPropagation();
        // Mark as read instead of deleting - this removes it from bell but keeps it in notifications page
        markNotificationAsRead(notificationId);
        loadNotifications(user.id);
    };

    const formatTime = (timestamp) => {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
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

    if (!user) {
        // NotificationBell: No user found, not rendering
        return null;
    }

    // NotificationBell: Rendering for user, Unread count

    return (
        <div className="notification-bell-container">
            <button
                className="notification-bell"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {showDropdown && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="unread-count">{unreadCount} new</span>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notification.title}</div>
                                        <div className="notification-message">{notification.message}</div>
                                        {notification.type === 'booking_cancelled' && notification.refundInstructions && (
                                            <div className="notification-details" style={{
                                                marginTop: '8px',
                                                padding: '8px',
                                                background: 'rgba(34, 197, 94, 0.1)',
                                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                color: '#15803d'
                                            }}>
                                                💡 {notification.refundInstructions}
                                            </div>
                                        )}
                                        <div className="notification-time">{formatTime(notification.timestamp)}</div>
                                    </div>
                                    <button
                                        className="notification-delete"
                                        onClick={(e) => handleDismissNotification(notification.id, e)}
                                        aria-label="Dismiss notification"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button
                                className="view-all-btn"
                                onClick={handleViewAllNotifications}
                            >
                                View All Notifications
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showDropdown && (
                <div
                    className="notification-overlay"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
};

export default NotificationBell;
