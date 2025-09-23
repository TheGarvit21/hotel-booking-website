/**
 * Sample reviews initialization - Only authenticated user reviews
 */

import { isProduction } from './security.js';
import { getJSON, setJSON } from './storage.js';

const REVIEWS_STORAGE_KEY = 'hotel_reviews_global';

/**
 * Initialize sample reviews for demonstration (authenticated users only)
 * These represent real user accounts that have posted reviews
 */
export function initializeSampleReviews() {
    const existingReviews = getJSON(REVIEWS_STORAGE_KEY, { fallback: {} });

    // Only initialize if no reviews exist yet
    if (Object.keys(existingReviews).length === 0) {
        // Note: In production, these would be real authenticated users
        const sampleReviews = {};

        // Leave empty for now - only real authenticated users should have reviews
        // Users can create accounts and post their own reviews

        setJSON(REVIEWS_STORAGE_KEY, sampleReviews);
        if (!isProduction()) {
            console.log('Review system initialized - ready for authenticated user reviews only');
        }
    }
}

/**
 * Clear all reviews (for testing)
 */
export function clearAllReviews() {
    setJSON(REVIEWS_STORAGE_KEY, {});
    if (!isProduction()) {
        console.log('All reviews cleared');
    }
}
