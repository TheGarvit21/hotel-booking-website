/**
 * Security utilities for input sanitization and data protection
 */

// Simple HTML entity encoding to prevent XSS
export const sanitizeHtml = (str) => {
    if (typeof str !== 'string') return str;

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// Sanitize user input for display
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .slice(0, 1000); // Limit length
};

// Password hashing (simple client-side - NOT for production)
export const hashPassword = async (password) => {
    // For demo purposes only - use proper backend hashing in production
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_demo_only');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Simple encryption for localStorage (demo only)
export const encryptData = (data) => {
    try {
        const jsonString = JSON.stringify(data);
        return btoa(jsonString); // Base64 encoding (not secure, just obfuscation)
    } catch {
        return null;
    }
};

export const decryptData = (encryptedData) => {
    try {
        const jsonString = atob(encryptedData);
        return JSON.parse(jsonString);
    } catch {
        return null;
    }
};

// Rate limiting for API calls
const rateLimitMap = new Map();

export const checkRateLimit = (key, maxRequests = 10, windowMs = 60000) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, []);
    }

    const requests = rateLimitMap.get(key).filter(time => time > windowStart);

    if (requests.length >= maxRequests) {
        return false; // Rate limit exceeded
    }

    requests.push(now);
    rateLimitMap.set(key, requests);
    return true;
};

// CSP violation reporting
export const setupCSP = () => {
    document.addEventListener('securitypolicyviolation', (e) => {
        console.warn('CSP violation:', {
            violatedDirective: e.violatedDirective,
            blockedURI: e.blockedURI,
            originalPolicy: e.originalPolicy
        });
    });
};

// Input validation patterns
export const validators = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^[+]?[1-9][\d]{0,15}$/,
    name: /^[a-zA-Z\s]{2,50}$/,
    alphanumeric: /^[a-zA-Z0-9]+$/
};

// Secure random ID generation
export const generateSecureId = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Environment check
export const isProduction = () => import.meta.env.PROD;
export const isDevelopment = () => import.meta.env.DEV;
