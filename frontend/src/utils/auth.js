// auth.js - Backend API Authentication Module
import { apiFetch } from '../services/apiClient.js';

// Storage keys for tokens
const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user'
};

// Private in-memory cache
let cachedUser = null;
let cachedAccessToken = null;

// Token management
const getStoredTokens = () => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  return { accessToken, refreshToken };
};

const setStoredTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
};

const clearStoredTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
};

// Get current user from cache or storage
export const getCurrentUser = async () => {
  if (cachedUser) return cachedUser;
  
  const storedUser = localStorage.getItem(STORAGE_KEYS.user);
  if (storedUser) {
    try {
      cachedUser = JSON.parse(storedUser);
      return cachedUser;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      clearStoredTokens();
      return null;
    }
  }
  
  return null;
};

// Set current user in cache and storage
export const setCurrentUser = (user) => {
  if (!user || typeof user !== 'object') {
    console.error('Invalid user object');
    return;
  }

  cachedUser = user;
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  
  // Broadcast auth change event
  window.dispatchEvent(new CustomEvent('auth:change', { detail: { user } }));
};

// Get access token
export const getAccessToken = () => {
  if (cachedAccessToken) return cachedAccessToken;
  
  const { accessToken } = getStoredTokens();
  cachedAccessToken = accessToken;
  return accessToken;
};

// Set tokens
export const setTokens = (accessToken, refreshToken) => {
  cachedAccessToken = accessToken;
  setStoredTokens(accessToken, refreshToken);
};

// User registration
export const registerUser = async (userData) => {
  try {
    const response = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: userData
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
      body: { email, password }
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

// Refresh token
export const refreshAccessToken = async () => {
  try {
    const { refreshToken } = getStoredTokens();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiFetch('/api/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken }
    });

    if (response.success) {
      const { tokens } = response.data;
      setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    } else {
      throw new Error(response.error?.message || 'Token refresh failed');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    // If refresh fails, logout user
    await logout();
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    const { accessToken } = getStoredTokens();
    if (accessToken) {
      // Call logout endpoint (optional, for server-side cleanup)
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if API fails
  } finally {
    // Clear all stored data
    cachedUser = null;
    cachedAccessToken = null;
    clearStoredTokens();
    
    // Broadcast auth change event
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null } }));
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
  const { accessToken } = getStoredTokens();
  return !!accessToken;
};

// Async authentication check
export const isAuthenticatedAsync = async () => {
  const user = await getCurrentUser();
  return !!user;
};

// Synchronous current user getter
export const getCurrentUserSync = () => {
  if (cachedUser) return cachedUser;
  
  const storedUser = localStorage.getItem(STORAGE_KEYS.user);
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  }
  
  return null;
};
