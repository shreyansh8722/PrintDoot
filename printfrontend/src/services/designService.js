import apiHook from './apiConfig';

const designService = {
    // Get all saved designs for the current user
    getMyDesigns: async (params = {}) => {
        try {
            const response = await apiHook.get('/my-designs/', { params });
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching designs:', error);
            throw error;
        }
    },

    // Get a single design by ID
    getDesign: async (id) => {
        try {
            const response = await apiHook.get(`/my-designs/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching design ${id}:`, error);
            throw error;
        }
    },

    // Create a new design
    createDesign: async (designData) => {
        try {
            const response = await apiHook.post('/my-designs/', designData);
            return response.data;
        } catch (error) {
            console.error('Error creating design:', error);
            throw error;
        }
    },

    // Update a design
    updateDesign: async (id, designData) => {
        try {
            const response = await apiHook.patch(`/my-designs/${id}/`, designData);
            return response.data;
        } catch (error) {
            console.error(`Error updating design ${id}:`, error);
            throw error;
        }
    },

    // Delete a design
    deleteDesign: async (id) => {
        try {
            const response = await apiHook.delete(`/my-designs/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting design ${id}:`, error);
            throw error;
        }
    },

    // Get all assets for the current user
    getMyAssets: async (params = {}) => {
        try {
            const response = await apiHook.get('/assets/', { params });
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching assets:', error);
            throw error;
        }
    },

    // Upload a new asset
    uploadAsset: async (file, type = 'image') => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            
            const response = await apiHook.post('/assets/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading asset:', error);
            throw error;
        }
    },

    // Delete an asset
    deleteAsset: async (id) => {
        try {
            const response = await apiHook.delete(`/assets/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting asset ${id}:`, error);
            throw error;
        }
    }
};

export default designService;
