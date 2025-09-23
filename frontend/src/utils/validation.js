/**
 * Lightweight validation and normalization helpers (UI-agnostic)
 */

/** Normalize and lowercase an email string */
export const normalizeEmail = (email = '') => email.trim().toLowerCase();

/** Validate email; return error message or empty string */
export const validateEmail = (email = '') => {
    const value = email.trim();
    if (!value) return 'Email is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
};

/** Validate name; return error message or empty string */
export const validateName = (name = '') => {
    const value = name.trim();
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name is too short';
    return '';
};

/**
 * Validate password; returns { error, weak }
 * error blocks submit; weak is a non-blocking hint
 */
export const validatePassword = (password = '') => {
    if (!password) return { error: 'Password is required', weak: '' };
    if (password.length < 6) return { error: 'Password must be at least 6 characters', weak: '' };
    const lacksDigitsAndSymbols = !/\d/.test(password) && !/[!@#$%^&*]/.test(password);
    return {
        error: '',
        weak: lacksDigitsAndSymbols ? 'Consider adding numbers or special characters for a stronger password' : ''
    };
};

/** Validate confirm password; return error message or empty string */
export const validateConfirmPassword = (password = '', confirm = '') => {
    if (!confirm) return 'Please confirm your password';
    if (password !== confirm) return 'Passwords do not match';
    return '';
};
