import { authenticatedApiFetch } from './apiClient.js';

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const response = await authenticatedApiFetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    return response;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

// Get user's bookings
export const getUserBookings = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const path = queryString ? `/api/bookings?${queryString}` : '/api/bookings';
    
    const response = await authenticatedApiFetch(path);
    return response;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

// Get booking by ID
export const getBookingById = async (id) => {
  try {
    const response = await authenticatedApiFetch(`/api/bookings/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

// Update booking
export const updateBooking = async (id, bookingData) => {
  try {
    const response = await authenticatedApiFetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    return response;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

// Cancel booking
export const cancelBooking = async (id) => {
  try {
    const response = await authenticatedApiFetch(`/api/bookings/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

// Get all bookings (admin only)
export const getAllBookings = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const path = queryString ? `/api/bookings/admin/all?${queryString}` : '/api/bookings/admin/all';
    
    const response = await authenticatedApiFetch(path);
    return response;
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    throw error;
  }
};

// Helper function to get bookings with fallback to local storage
export const getBookingsWithFallback = async (filters = {}) => {
  try {
    // Try to fetch from backend first
    const response = await getUserBookings(filters);
    if (response && response.success && response.data) {
      return response.data;
    }
    throw new Error('Backend response invalid');
  } catch (error) {
    console.warn('Backend fetch failed, falling back to local storage:', error);
    
    // Fallback to local storage
    try {
      const { getBookings } = await import('../utils/bookings.js');
      const localBookings = getBookings();
      
      // Apply basic filtering to local bookings
      let filteredBookings = Array.isArray(localBookings) ? localBookings : [];
      
      if (filters.status && filters.status !== 'all') {
        filteredBookings = filteredBookings.filter(booking => booking.status === filters.status);
      }
      
      return filteredBookings;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
};

// Helper function to create booking with fallback
export const createBookingWithFallback = async (bookingData) => {
  try {
    // Try to create booking via API
    const response = await createBooking(bookingData);
    if (response && response.success) {
      return response;
    }
    throw new Error('Backend response invalid');
  } catch (error) {
    console.warn('Backend booking creation failed, using fallback:', error);
    
    // Fallback to local storage
    try {
      const { addBooking } = await import('../utils/bookings.js');
      const localResponse = await addBooking(bookingData);
      return {
        success: true,
        message: 'Booking created locally (offline mode)',
        data: localResponse
      };
    } catch (fallbackError) {
      console.error('Fallback booking creation also failed:', fallbackError);
      throw fallbackError;
    }
  }
};
