/**
 * Review management utilities for local storage
 * Reviews are shared across all users to simulate a real review system
 */

import { getCurrentUserSync } from './auth.js';
import { getJSON, setJSON } from './storage.js';

const REVIEWS_STORAGE_KEY = 'hotel_reviews_global'; // Global reviews for all users

/**
 * Get all reviews from localStorage (global across all users)
 */
export function getAllReviews() {
    return getJSON(REVIEWS_STORAGE_KEY, { fallback: {} });
}

/**
 * Get reviews for a specific hotel
 */
export function getHotelReviews(hotelId) {
    const allReviews = getAllReviews();
    return allReviews[hotelId] || [];
}

/**
 * Add a new review for a hotel
 */
export function addReview(review) {
    const currentUser = getCurrentUserSync();
    if (!currentUser) {
        throw new Error('User must be logged in to post a review');
    }

    const allReviews = getAllReviews();
    const hotelId = review.hotelId;

    if (!allReviews[hotelId]) {
        allReviews[hotelId] = [];
    }

    // Check if user has already reviewed this hotel
    const existingReviewIndex = allReviews[hotelId].findIndex(
        r => r.userId === currentUser.id
    );

    // Add timestamp, unique ID, and user info
    const newReview = {
        ...review,
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id,
        userName: review.userName || currentUser.name || currentUser.email.split('@')[0],
        createdAt: new Date().toISOString(),
        date: review.date || new Date().toISOString().split('T')[0]
    };

    if (existingReviewIndex !== -1) {
        // Update existing review
        allReviews[hotelId][existingReviewIndex] = {
            ...allReviews[hotelId][existingReviewIndex],
            ...newReview,
            updatedAt: new Date().toISOString()
        };
    } else {
        // Add new review
        allReviews[hotelId].push(newReview);
    }

    // Sort reviews by creation date (newest first)
    allReviews[hotelId].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setJSON(REVIEWS_STORAGE_KEY, allReviews);

    return existingReviewIndex !== -1 ? allReviews[hotelId][existingReviewIndex] : newReview;
}

/**
 * Update a review (only by the original author)
 */
export function updateReview(hotelId, reviewId, updates) {
    const currentUser = getCurrentUserSync();
    if (!currentUser) {
        throw new Error('User must be logged in to update a review');
    }

    const allReviews = getAllReviews();

    if (!allReviews[hotelId]) {
        throw new Error('Hotel not found');
    }

    const reviewIndex = allReviews[hotelId].findIndex(review => review.id === reviewId);

    if (reviewIndex === -1) {
        throw new Error('Review not found');
    }

    const existingReview = allReviews[hotelId][reviewIndex];

    // Check if current user is the author
    if (existingReview.userId !== currentUser.id) {
        throw new Error('You can only edit your own reviews');
    }

    allReviews[hotelId][reviewIndex] = {
        ...existingReview,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    // Sort reviews by creation date (newest first)
    allReviews[hotelId].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setJSON(REVIEWS_STORAGE_KEY, allReviews);

    return allReviews[hotelId][reviewIndex];
}

/**
 * Delete a review (only by the original author)
 */
export function deleteReview(hotelId, reviewId) {
    const currentUser = getCurrentUserSync();
    if (!currentUser) {
        throw new Error('User must be logged in to delete a review');
    }

    const allReviews = getAllReviews();

    if (!allReviews[hotelId]) {
        throw new Error('Hotel not found');
    }

    const reviewIndex = allReviews[hotelId].findIndex(review => review.id === reviewId);

    if (reviewIndex === -1) {
        throw new Error('Review not found');
    }

    const existingReview = allReviews[hotelId][reviewIndex];

    // Check if current user is the author
    if (existingReview.userId !== currentUser.id) {
        throw new Error('You can only delete your own reviews');
    }

    allReviews[hotelId].splice(reviewIndex, 1);

    setJSON(REVIEWS_STORAGE_KEY, allReviews);

    return true;
}

/**
 * Get review statistics for a hotel
 */
export function getReviewStats(hotelId) {
    const reviews = getHotelReviews(hotelId);

    if (reviews.length === 0) {
        return {
            count: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = reviews.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1;
        return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
        count: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        ratingDistribution
    };
}

/**
 * Check if current user has already reviewed a hotel
 */
export function hasUserReviewed(hotelId, userId = null) {
    const currentUser = getCurrentUserSync();
    const targetUserId = userId || currentUser?.id;

    if (!targetUserId) return false;

    const reviews = getHotelReviews(hotelId);
    return reviews.some(review => review.userId === targetUserId);
}

/**
 * Get current user's review for a specific hotel
 */
export function getUserReview(hotelId, userId = null) {
    const currentUser = getCurrentUserSync();
    const targetUserId = userId || currentUser?.id;

    if (!targetUserId) return null;

    const reviews = getHotelReviews(hotelId);
    return reviews.find(review => review.userId === targetUserId) || null;
}

/**
 * Format review date for display
 */
export function formatReviewDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}
