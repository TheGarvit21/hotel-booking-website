// notifications.js
// User notification system

import { isProduction } from './security.js';

const STORAGE_KEY = 'notifications';

// Get all notifications for a specific user
export const getUserNotifications = (userId) => {
    try {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return notifications.filter(notification => notification.userId === userId);
    } catch (error) {
        if (!isProduction()) {
            // Error getting notifications
        }
        return [];
    }
};

// Add a new notification
export const addNotification = (notification) => {
    try {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        notifications.push(newNotification);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));

        // Dispatch a custom event to notify components
        window.dispatchEvent(new CustomEvent('notification:updated', {
            detail: {
                notification: newNotification,
                userId: notification.userId
            }
        }));

        // Notification added
        return newNotification;
    } catch (error) {
        // Error adding notification
        return null;
    }
};

// Mark notification as read
export const markNotificationAsRead = (notificationId) => {
    try {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const updatedNotifications = notifications.map(notification =>
            notification.id === notificationId
                ? { ...notification, read: true }
                : notification
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
        return true;
    } catch (error) {
        // Error marking notification as read
        return false;
    }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = (userId) => {
    try {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const updatedNotifications = notifications.map(notification =>
            notification.userId === userId
                ? { ...notification, read: true }
                : notification
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
        return true;
    } catch (error) {
        // Error marking all notifications as read
        return false;
    }
};

// Delete a notification
export const deleteNotification = (notificationId) => {
    try {
        const notifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const filteredNotifications = notifications.filter(notification => notification.id !== notificationId);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNotifications));
        return true;
    } catch (error) {
        // Error deleting notification
        return false;
    }
};

// Get unread notification count for a user
export const getUnreadNotificationCount = (userId) => {
    try {
        const notifications = getUserNotifications(userId);
        return notifications.filter(notification => !notification.read).length;
    } catch (error) {
        // Error getting unread count
        return 0;
    }
};

// Create booking cancellation notification
export const createBookingCancellationNotification = (userId, bookingDetails, cancelledBy = 'admin') => {
    // Detect and fix currency mismatch (same logic as AdminDashboard)
    const detectAndFixCurrencyMismatch = (amount, currencyCode) => {
        if (amount > 5000 && ['USD', 'EUR', 'GBP'].includes(currencyCode)) {
            // Detected currency mismatch: amount ${amount} in ${currencyCode}, likely INR
            return { amount, currency: 'INR' };
        }
        return { amount, currency: currencyCode };
    };

    // Format currency properly based on booking currency
    const formatCurrency = (amount, currencyCode = 'INR') => {
        const corrected = detectAndFixCurrencyMismatch(amount, currencyCode);
        const safeCurrency = corrected.currency;
        const locale = safeCurrency === 'INR' ? 'en-IN' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: safeCurrency,
        }).format(corrected.amount);
    };

    const refundAmount = formatCurrency(bookingDetails.totalPrice, bookingDetails.currency || 'INR');

    // Get corrected currency for storage
    const correctedCurrency = detectAndFixCurrencyMismatch(bookingDetails.totalPrice, bookingDetails.currency || 'INR');

    const notification = {
        userId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled - Refund Processing',
        message: cancelledBy === 'admin'
            ? `Your booking for ${bookingDetails.hotelName} has been cancelled by the administrator. Your refund of ${refundAmount} will be processed within 24 hours. You will receive the money back in your original payment method.`
            : `Your booking for ${bookingDetails.hotelName} has been cancelled. Your refund of ${refundAmount} will be processed within 24 hours.`,
        bookingId: bookingDetails.id,
        refundAmount: bookingDetails.totalPrice,
        refundCurrency: correctedCurrency.currency,
        hotelName: bookingDetails.hotelName,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        cancelledBy,
        priority: 'high',
        actionRequired: false,
        refundInstructions: 'Your refund will be processed automatically within 24 hours. No action required from your side.'
    };

    return addNotification(notification);
};

// Create booking confirmation notification
export const createBookingConfirmationNotification = (userId, bookingDetails) => {
    // Detect and fix currency mismatch (same logic as AdminDashboard)
    const detectAndFixCurrencyMismatch = (amount, currencyCode) => {
        if (amount > 5000 && ['USD', 'EUR', 'GBP'].includes(currencyCode)) {
            // Detected currency mismatch: amount ${amount} in ${currencyCode}, likely INR
            return { amount, currency: 'INR' };
        }
        return { amount, currency: currencyCode };
    };

    // Format currency properly based on booking currency
    const formatCurrency = (amount, currencyCode = 'INR') => {
        const corrected = detectAndFixCurrencyMismatch(amount, currencyCode);
        const safeCurrency = corrected.currency;
        const locale = safeCurrency === 'INR' ? 'en-IN' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: safeCurrency,
        }).format(corrected.amount);
    };

    const checkInDate = new Date(bookingDetails.checkIn).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const checkOutDate = new Date(bookingDetails.checkOut).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const totalAmount = bookingDetails.totalPrice ? formatCurrency(bookingDetails.totalPrice, bookingDetails.currency) : '';
    const nightText = bookingDetails.nights === 1 ? 'night' : 'nights';
    const guestText = bookingDetails.guests === 1 ? 'guest' : 'guests';

    // Get corrected currency for storage
    const correctedCurrency = detectAndFixCurrencyMismatch(bookingDetails.totalPrice || 0, bookingDetails.currency || 'INR');

    const notification = {
        userId,
        type: 'booking_confirmed',
        title: '🎉 Booking Confirmed!',
        message: `Your reservation at ${bookingDetails.hotelName}${bookingDetails.hotelLocation ? `, ${bookingDetails.hotelLocation}` : ''} has been confirmed! 
        
📅 Check-in: ${checkInDate}
📅 Check-out: ${checkOutDate}
👥 ${bookingDetails.guests} ${guestText} • ${bookingDetails.nights} ${nightText}
${totalAmount ? `💰 Total: ${totalAmount}` : ''}

Have a wonderful stay! Remember to check our cancellation policy for any changes to your plans.`,
        bookingId: bookingDetails.id,
        hotelName: bookingDetails.hotelName,
        hotelLocation: bookingDetails.hotelLocation,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        guests: bookingDetails.guests,
        nights: bookingDetails.nights,
        totalPrice: bookingDetails.totalPrice,
        currency: correctedCurrency.currency,
        priority: 'medium',
        actionRequired: false
    };

    return addNotification(notification);
};
