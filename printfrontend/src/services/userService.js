import apiHook from './apiConfig';
import axios from 'axios';

const userService = {
    // Authentication
    register: async (userData) => {
        try {
            const response = await apiHook.post('/users/register/', userData);
            return response.data;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    },

    login: async (username, password) => {
        try {
            // Using Basic Auth - Django REST Framework accepts Basic Auth for login
            const credentials = btoa(`${username}:${password}`);

            const response = await apiHook.get('/users/me/', {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                },
                withCredentials: true, // For session cookies
            });

            // Store credentials for future requests
            localStorage.setItem('authCredentials', credentials);
            localStorage.setItem('username', username);

            return response.data;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('authCredentials');
        localStorage.removeItem('username');
        localStorage.removeItem('token');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('authCredentials');
    },

    getAuthHeader: () => {
        const credentials = localStorage.getItem('authCredentials');
        return credentials ? `Basic ${credentials}` : null;
    },

    // User Profile
    getProfile: async () => {
        try {
            const response = await apiHook.get('/users/me/');
            return response.data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },

    updateProfile: async (data) => {
        try {
            const response = await apiHook.patch('/users/me/', data);
            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    // Addresses
    getAddresses: async () => {
        try {
            const response = await apiHook.get('/addresses/');
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching addresses:', error);
            throw error;
        }
    },

    createAddress: async (addressData) => {
        try {
            const response = await apiHook.post('/addresses/', addressData);
            return response.data;
        } catch (error) {
            console.error('Error creating address:', error);
            throw error;
        }
    },

    updateAddress: async (id, addressData) => {
        try {
            const response = await apiHook.patch(`/addresses/${id}/`, addressData);
            return response.data;
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    },

    deleteAddress: async (id) => {
        try {
            const response = await apiHook.delete(`/addresses/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
    },

    // ========================================
    // Change Password (authenticated user)
    // ========================================

    /**
     * Change password for the currently logged-in user.
     * @param {string} oldPassword
     * @param {string} newPassword
     * @param {string} newPasswordConfirm
     */
    changePassword: async (oldPassword, newPassword, newPasswordConfirm) => {
        try {
            const response = await apiHook.post('/users/change-password/', {
                old_password: oldPassword,
                new_password: newPassword,
                new_password_confirm: newPasswordConfirm,
            });
            return response.data;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    },

    // ========================================
    // Password Reset
    // ========================================

    /**
     * Request a password reset email.
     * @param {string} email
     */
    forgotPassword: async (email) => {
        try {
            const response = await apiHook.post('/auth/password-reset/', { email });
            return response.data;
        } catch (error) {
            console.error('Error requesting password reset:', error);
            throw error;
        }
    },

    /**
     * Reset password using token from email link.
     * @param {string} token - UUID token from the reset link
     * @param {string} password
     * @param {string} passwordConfirm
     */
    resetPassword: async (token, password, passwordConfirm) => {
        try {
            const response = await apiHook.post('/auth/password-reset/confirm/', {
                token,
                password,
                password_confirm: passwordConfirm,
            });
            return response.data;
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    },

    // ========================================
    // Email Verification
    // ========================================

    /**
     * Verify email using token from verification link.
     * @param {string} token - UUID token from the verification link
     */
    verifyEmail: async (token) => {
        try {
            const response = await apiHook.post('/auth/verify-email/', { token });
            return response.data;
        } catch (error) {
            console.error('Error verifying email:', error);
            throw error;
        }
    },

    /**
     * Resend verification email.
     * @param {string} email
     */
    resendVerification: async (email) => {
        try {
            const response = await apiHook.post('/auth/resend-verification/', { email });
            return response.data;
        } catch (error) {
            console.error('Error resending verification:', error);
            throw error;
        }
    },

    // ========================================
    // Avatar Upload
    // ========================================

    /**
     * Upload user avatar (multipart/form-data).
     * @param {File} file - Image file
     */
    uploadAvatar: async (file) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const response = await apiHook.post('/users/upload-avatar/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    },

    /**
     * Remove user avatar.
     */
    removeAvatar: async () => {
        try {
            const response = await apiHook.delete('/users/remove-avatar/');
            return response.data;
        } catch (error) {
            console.error('Error removing avatar:', error);
            throw error;
        }
    },

    // ========================================
    // Pincode Validation
    // ========================================

    /**
     * Check if a pincode is serviceable.
     * @param {string} pincode
     * @returns {{ serviceable: boolean, city?: string, state?: string, zone?: string, cod_available?: boolean }}
     */
    validatePincode: async (pincode) => {
        try {
            const response = await apiHook.post('/pincode-check/', { pincode });
            return response.data;
        } catch (error) {
            console.error('Error validating pincode:', error);
            throw error;
        }
    },

    // ========================================
    // Contact Form
    // ========================================

    /**
     * Submit a contact form message.
     * @param {{ name, email, phone, subject, message, inquiry_type }} formData
     */
    submitContactForm: async (formData) => {
        try {
            const response = await apiHook.post('/contact/', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || '',
                subject: formData.subject,
                message: formData.message,
                inquiry_type: formData.inquiryType || 'general',
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting contact form:', error);
            throw error;
        }
    },
};

export default userService;
