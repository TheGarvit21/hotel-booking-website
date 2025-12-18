import { authenticatedApiFetch } from './apiClient.js';

// Get all users (admin only)
export const getAllUsers = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        // Add filters to query params
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });

        const queryString = queryParams.toString();
        const path = queryString ? `/api/users?${queryString}` : '/api/users';

        const response = await authenticatedApiFetch(path);
        return response;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Get user by ID (admin only for other users)
export const getUserById = async (id) => {
    try {
        const response = await authenticatedApiFetch(`/api/users/${id}`);
        return response;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

// Create new user (admin only)
export const createUser = async (userData) => {
    try {
        const response = await authenticatedApiFetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return response;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Update user settings/profile (admin only)
export const updateUser = async (id, userData) => {
    try {
        const response = await authenticatedApiFetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return response;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

// Delete user (admin only)
export const deleteUser = async (id) => {
    try {
        const response = await authenticatedApiFetch(`/api/users/${id}`, {
            method: 'DELETE',
        });
        return response;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};
