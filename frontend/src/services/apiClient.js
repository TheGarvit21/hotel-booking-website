// API client with automatic authentication handling
import { getAccessToken, refreshAccessToken } from '../utils/auth.js';

const DEFAULTS = {
    baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000',
    headers: { 'Content-Type': 'application/json' },
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Main API fetch function with automatic token handling
export async function apiFetch(path, { method = 'GET', body, headers = {}, token, skipAuth = false } = {}) {
    const url = `${DEFAULTS.baseURL}${path}`;
    const h = { ...DEFAULTS.headers, ...headers };
    
    // Add authentication token if not skipped
    if (!skipAuth) {
        let accessToken = token || getAccessToken();
        
        // If token is expired, try to refresh it
        if (accessToken && isTokenExpired(accessToken)) {
            try {
                accessToken = await refreshAccessToken();
            } catch (error) {
                console.error('Token refresh failed:', error);
                // Continue without token, let the server handle the response
            }
        }
        
        if (accessToken) {
            h.Authorization = `Bearer ${accessToken}`;
        }
    }
    
    try {
        const res = await fetch(url, {
            method,
            headers: h,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include',
        });
        
        if (!res.ok) {
            let payload;
            try { 
                payload = await res.json(); 
            } catch { 
                payload = { error: { code: `${res.status}`, message: res.statusText } }; 
            }
            
            const err = new Error(payload?.error?.message || res.statusText);
            err.status = res.status;
            err.code = payload?.error?.code || `${res.status}`;
            err.details = payload?.error?.details;
            
            // Handle authentication errors
            if (res.status === 401) {
                // Token is invalid, clear it
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                
                // Dispatch auth change event
                window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null } }));
            }
            
            throw err;
        }
        
        if (res.status === 204) return null;
        
        try { 
            return await res.json(); 
        } catch { 
            return null; 
        }
    } catch (error) {
        // Re-throw the error to be handled by the caller
        throw error;
    }
}

// Helper function for authenticated requests
export function withToken(getToken) {
    return async (path, opts = {}) => apiFetch(path, { ...opts, token: getToken?.() });
}

// Helper function for requests that don't need authentication
export function publicApiFetch(path, opts = {}) {
    return apiFetch(path, { ...opts, skipAuth: true });
}

// Helper function for authenticated requests with automatic token handling
export function authenticatedApiFetch(path, opts = {}) {
    return apiFetch(path, { ...opts });
}
