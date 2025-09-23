// Utility to clean up sample data and keep only real user data
import { getUsers } from './auth';

// Helper to clear cached users in auth.js (if available)
function clearUserCache() {
    if (typeof window !== 'undefined' && window.localStorage) {
        // Remove cached users if present in memory (works if exported in auth.js)
        if (typeof window.cachedUsers !== 'undefined') {
            window.cachedUsers = null;
        }
    }
}

export const cleanupSampleData = () => {
    try {
        clearUserCache();
        // Get real authenticated users
        const realUsers = getUsers() || [];
        // Ensure realUsers is an array
        if (!Array.isArray(realUsers)) {
            console.warn('getUsers() did not return an array:', realUsers);
            return { removed: 0, remaining: 0 };
        }
        // Ensure all user IDs are strings for comparison
        const realUserIds = realUsers.map(user => String(user.id)).filter(Boolean);

        // Clean bookings - keep only those belonging to real users
        let allBookings = [];
        try {
            const raw = localStorage.getItem('bookings');
            allBookings = Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
        } catch {
            allBookings = [];
        }
        // Validate booking.userId exists and compare as string
        const realBookings = allBookings.filter(booking =>
            booking && booking.userId && realUserIds.includes(String(booking.userId))
        );


        localStorage.setItem('bookings', JSON.stringify(realBookings));

        return {
            removed: allBookings.length - realBookings.length,
            remaining: realBookings.length
        };
    } catch (error) {
        console.error('Error cleaning up sample data:', error);
        return { removed: 0, remaining: 0 };
    }
}

export const getDataSummary = () => {
    try {
        const realUsers = getUsers() || [];
        // Ensure realUsers is an array
        if (!Array.isArray(realUsers)) {
            console.warn('getUsers() did not return an array:', realUsers);
            return { totalUsers: 0, totalBookings: 0, realBookings: 0, sampleBookings: 0 };
        }
        const realUserIds = realUsers.map(u => String(u.id)).filter(Boolean);
        let allBookings = [];
        try {
            const raw = localStorage.getItem('bookings');
            allBookings = Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
        } catch {
            allBookings = [];
        }
        const realBookings = allBookings.filter(booking =>
            booking && booking.userId && realUserIds.includes(String(booking.userId))
        );

        return {
            totalUsers: realUsers.length,
            totalBookings: allBookings.length,
            realBookings: realBookings.length,
            sampleBookings: allBookings.length - realBookings.length
        };
    } catch (error) {
        console.error('Error getting data summary:', error);
        return { totalUsers: 0, totalBookings: 0, realBookings: 0, sampleBookings: 0 };
    }
}
