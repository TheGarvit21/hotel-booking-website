import { apiFetch, publicApiFetch, authenticatedApiFetch } from './apiClient.js';

// Get all hotels with optional filters
export const getHotels = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const path = queryString ? `/api/hotels?${queryString}` : '/api/hotels';
    
    const response = await publicApiFetch(path);
    return response;
  } catch (error) {
    console.error('Error fetching hotels:', error);
    throw error;
  }
};

// Get hotel by ID
export const getHotelById = async (id) => {
  try {
    const response = await publicApiFetch(`/api/hotels/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching hotel:', error);
    throw error;
  }
};

// Get featured hotels
export const getFeaturedHotels = async (limit = 12) => {
  try {
    const response = await publicApiFetch(`/api/hotels/featured?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error fetching featured hotels:', error);
    throw error;
  }
};

// Get hotels by city
export const getHotelsByCity = async (city, limit = 10) => {
  try {
    const response = await publicApiFetch(`/api/hotels/city/${encodeURIComponent(city)}?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error fetching hotels by city:', error);
    throw error;
  }
};

// Search hotels
export const searchHotels = async (query, city = null, limit = 20) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (city) queryParams.append('city', city);
    queryParams.append('limit', limit);

    const response = await publicApiFetch(`/api/hotels/search?${queryParams.toString()}`);
    return response;
  } catch (error) {
    console.error('Error searching hotels:', error);
    throw error;
  }
};

// Create new hotel (Admin only)
export const createHotel = async (hotelData) => {
  try {
    const response = await authenticatedApiFetch('/api/hotels', {
      method: 'POST',
      body: hotelData
    });
    return response;
  } catch (error) {
    console.error('Error creating hotel:', error);
    throw error;
  }
};

// Update hotel (Admin only)
export const updateHotel = async (id, hotelData) => {
  try {
    const response = await authenticatedApiFetch(`/api/hotels/${id}`, {
      method: 'PUT',
      body: hotelData
    });
    return response;
  } catch (error) {
    console.error('Error updating hotel:', error);
    throw error;
  }
};

// Delete hotel (Admin only)
export const deleteHotel = async (id) => {
  try {
    const response = await authenticatedApiFetch(`/api/hotels/${id}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting hotel:', error);
    throw error;
  }
};

// Helper function to get hotels with fallback to local storage
export const getHotelsWithFallback = async (filters = {}) => {
  try {
    // Try to fetch from backend first
    const response = await getHotels(filters);
    if (response && response.success && response.data) {
      // Map _id to id for consistency
      return response.data.map(hotel => ({
        ...hotel,
        id: hotel.id || hotel._id
      }));
    }
    throw new Error('Backend response invalid');
  } catch (error) {
    console.warn('Backend fetch failed, falling back to local storage:', error);
    
    // Fallback to local storage
    try {
      const { getHotelsFromStorage } = await import('../data/hotels.js');
      const localHotels = await getHotelsFromStorage();
      
      // Apply basic filtering to local hotels
      let filteredHotels = localHotels;
      
      if (filters.city) {
        filteredHotels = filteredHotels.filter(hotel => 
          hotel.city.toLowerCase().includes(filters.city.toLowerCase())
        );
      }
      
      if (filters.minPrice) {
        filteredHotels = filteredHotels.filter(hotel => 
          hotel.price >= Number(filters.minPrice)
        );
      }
      
      if (filters.maxPrice) {
        filteredHotels = filteredHotels.filter(hotel => 
          hotel.price <= Number(filters.maxPrice)
        );
      }
      
      if (filters.minRating) {
        filteredHotels = filteredHotels.filter(hotel => 
          hotel.rating >= Number(filters.minRating)
        );
      }
      
      if (filters.featured === 'true') {
        filteredHotels = filteredHotels.filter(hotel => hotel.featured);
      }
      
      return filteredHotels;
    } catch (localError) {
      console.error('Local storage fallback also failed:', localError);
      return [];
    }
  }
};

// Helper function to get featured hotels with fallback
export const getFeaturedHotelsWithFallback = async (limit = 12) => {
  try {
    const response = await getFeaturedHotels(limit);
    if (response && response.success && response.data) {
      // Map _id to id for consistency
      return response.data.map(hotel => ({
        ...hotel,
        id: hotel.id || hotel._id
      }));
    }
    throw new Error('Backend response invalid');
  } catch (error) {
    console.warn('Backend featured hotels fetch failed, falling back to local storage:', error);
    
    try {
      const { getFeaturedHotels } = await import('../data/hotels.js');
      return await getFeaturedHotels();
    } catch (localError) {
      console.error('Local storage fallback also failed:', localError);
      return [];
    }
  }
};

// Helper function to get hotel by ID with fallback
export const getHotelByIdWithFallback = async (id) => {
  try {
    const response = await getHotelById(id);
    if (response && response.success && response.data) {
      // Map _id to id for consistency
      return {
        ...response.data,
        id: response.data.id || response.data._id
      };
    }
    throw new Error('Backend response invalid');
  } catch (error) {
    console.warn('Backend hotel fetch failed, falling back to local storage:', error);
    
    try {
      const { getHotelById } = await import('../data/hotels.js');
      return await getHotelById(id);
    } catch (localError) {
      console.error('Local storage fallback also failed:', localError);
      return null;
    }
  }
};
