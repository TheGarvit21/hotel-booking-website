// tokenManager.js - Manages JWT tokens, local storage persistence, and refresh flow
// Completely acyclic: has no dependency on apiClient or auth

const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user'
};

const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// In-memory cache for fast access
let cachedUser = null;
let cachedAccessToken = null;

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get the currently stored access token
 * @returns {string|null} Access token
 */
export const getAccessToken = () => {
  if (cachedAccessToken) return cachedAccessToken;
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  cachedAccessToken = token;
  return token;
};

/**
 * Get the currently stored refresh token
 * @returns {string|null} Refresh token
 */
export const getRefreshToken = () => {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
};

/**
 * Set access and refresh tokens in memory and storage
 * @param {string} accessToken 
 * @param {string} refreshToken 
 */
export const setTokens = (accessToken, refreshToken) => {
  cachedAccessToken = accessToken;
  if (accessToken) localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
};

/**
 * Clear all auth data from memory and local storage
 */
export const clearTokens = () => {
  cachedAccessToken = null;
  cachedUser = null;
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
  
  // Broadcast auth change event to update the UI (Navbar, etc.)
  window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null } }));
};

/**
 * Get current user from cache or localStorage
 * @returns {object|null} The user object
 */
export const getStoredUser = () => {
  if (cachedUser) return cachedUser;
  const storedUser = localStorage.getItem(STORAGE_KEYS.user);
  if (storedUser) {
    try {
      cachedUser = JSON.parse(storedUser);
      return cachedUser;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      clearTokens();
      return null;
    }
  }
  return null;
};

/**
 * Save user in cache and localStorage
 * @param {object} user 
 */
export const setStoredUser = (user) => {
  if (!user || typeof user !== 'object') {
    console.error('Invalid user object');
    return;
  }
  cachedUser = user;
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('auth:change', { detail: { user } }));
};

/**
 * Refresh the access token using direct fetch (to avoid circular dependencies)
 * @returns {Promise<string>} The new access token
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const res = await fetch(`${baseURL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include'
    });

    const response = await res.json();

    if (res.ok && response.success) {
      const { tokens } = response.data;
      setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    } else {
      throw new Error(response.error?.message || 'Token refresh failed');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    clearTokens();
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null } }));
    throw error;
  }
};
