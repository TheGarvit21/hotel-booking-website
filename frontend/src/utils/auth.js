// auth.js - Backend API Authentication Module
import { apiFetch } from '../services/apiClient.js';

import { 
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getStoredUser as getCurrentUser,
  setStoredUser as setCurrentUser,
  refreshAccessToken
} from './tokenManager.js';

export {
  getAccessToken,
  getCurrentUser,
  setCurrentUser,
  setTokens,
  refreshAccessToken
};

// User registration
export const registerUser = async (userData) => {
  try {
    const response = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: userData,
      skipAuth: true
    });

    if (response.success) {
      const { user, tokens } = response.data;
      setTokens(tokens.accessToken, tokens.refreshToken);
      setCurrentUser(user);
      return { success: true, user };
    } else {
      return { success: false, error: response.error?.message || 'Registration failed' };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: error.message || 'Registration failed' 
    };
  }
};

// User login
export const loginUser = async (email, password) => {
  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true
    });

    if (response.success) {
      const { user, tokens } = response.data;
      setTokens(tokens.accessToken, tokens.refreshToken);
      setCurrentUser(user);
      return { success: true, user };
    } else {
      return { success: false, error: response.error?.message || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Login failed' 
    };
  }
};

// Logout
export const logout = async () => {
  try {
    const accessToken = getAccessToken();
    if (accessToken) {
      // Call logout endpoint (optional, for server-side cleanup)
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        skipAuth: true
      });
    }
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if API fails
  } finally {
    // Clear all stored data
    clearTokens();
  }
};

// Update user profile
export const updateProfile = async (updateData) => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch('/api/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: updateData
    });

    if (response.success) {
      const { user } = response.data;
      setCurrentUser(user);
      return { success: true, user };
    } else {
      return { success: false, error: response.error?.message || 'Profile update failed' };
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return { 
      success: false, 
      error: error.message || 'Profile update failed' 
    };
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch('/api/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { currentPassword, newPassword }
    });

    if (response.success) {
      return { success: true };
    } else {
      return { success: false, error: response.error?.message || 'Password change failed' };
    }
  } catch (error) {
    console.error('Password change error:', error);
    return { 
      success: false, 
      error: error.message || 'Password change failed' 
    };
  }
};

// Get user by ID (for admin purposes)
export const getUserById = async (userId) => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

// Get all users (admin only)
export const getUsers = async () => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch('/api/users', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

// Add new user (admin only)
export const addUser = async (userData) => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: userData
    });

    return response;
  } catch (error) {
    console.error('Add user error:', error);
    throw error;
  }
};

// Update user (admin only)
export const updateUser = async (userId, updateData) => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: updateData
    });

    return response;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

// Set user status (admin only)
export const setUserStatus = async (userId, status) => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch(`/api/users/${userId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { status }
    });

    return response;
  } catch (error) {
    console.error('Set user status error:', error);
    throw error;
  }
};

// Search users (admin only)
export const searchUsers = async (query) => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch(`/api/users?search=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response;
  } catch (error) {
    console.error('Search users error:', error);
    throw error;
  }
};

// Check user permissions
export const checkUserPermissions = (user) => {
  if (!user) return { canLogin: false, canBook: false, canEditProfile: false };

  switch (user.status) {
    case 'banned':
      return {
        canLogin: false,
        canBook: false,
        canEditProfile: false,
        message: 'You have been banned by the admin. Please contact support.'
      };
    case 'inactive':
      return {
        canLogin: false,
        canBook: false,
        canEditProfile: false,
        message: 'Account is inactive. Please contact support.'
      };
    default: // 'active'
      return {
        canLogin: true,
        canBook: true,
        canEditProfile: true,
        isRestricted: false
      };
  }
};

// Check if user can make bookings
export const canUserBook = (user) => {
  const permissions = checkUserPermissions(user);
  return permissions.canBook;
};

// Check if user can edit profile
export const canUserEditProfile = (user) => {
  const permissions = checkUserPermissions(user);
  return permissions.canEditProfile;
};

// Get user statistics (admin only)
export const getUserStats = async () => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiFetch('/api/users/stats', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response;
  } catch (error) {
    console.error('Get user stats error:', error);
    throw error;
  }
};

// Check authentication status
export const isAuthenticated = () => {
  const accessToken = getAccessToken();
  return !!accessToken;
};

// Async authentication check
export const isAuthenticatedAsync = async () => {
  const user = await getCurrentUser();
  return !!user;
};

// Synchronous current user getter
export const getCurrentUserSync = () => {
  return getCurrentUser();
};
