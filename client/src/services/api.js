import axiosInstance from '../api/axiosConfig'; // Use the configured instance

// Create a new matter
export const createMatter = async (matterData) => {
  try {
    const response = await axiosInstance.post('/matters', matterData); // No need for authConfig()
    return response.data;
  } catch (error) {
    console.error('Error creating matter:', error.response?.data || error.message);
    throw error;
  }
};

// Get all matters
export const getMatters = async () => {
  try {
    const response = await axiosInstance.get('/matters'); // No need for authConfig()
    return response.data;
  } catch (error) {
    console.error('Error fetching matters:', error.response?.data || error.message);
    throw error;
  }
};

// Get a specific matter by ID
export const getMatterById = async (id) => {
  try {
    const response = await axiosInstance.get(`/matters/${id}`); // No need for authConfig()
    return response.data;
  } catch (error) {
    console.error(`Error fetching matter with id ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// Update a matter
export const updateMatter = async (id, matterData) => {
  try {
    const response = await axiosInstance.put(`/matters/${id}`, matterData); // No need for authConfig()
    return response.data;
  } catch (error) {
    console.error(`Error updating matter with id ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// Delete a matter
export const deleteMatter = async (id) => {
  try {
    const response = await axiosInstance.delete(`/matters/${id}`); // No need for authConfig()
    return response.data;
  } catch (error) {
    console.error(`Error deleting matter with id ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// Search matters
export const searchMatters = async (params) => {
  try {
    const response = await axiosInstance.get('/matters/search', { params }); // Pass params directly
    return response.data;
  } catch (error) {
    console.error('Error searching matters:', error.response?.data || error.message);
    throw error;
  }
};

// Get matter statistics by category
export const getMatterStatsByCategory = async () => {
  try {
    const response = await axiosInstance.get('/matters/stats/category'); // No need for authConfig()
    return response.data;
  } catch (error) {
    console.error('Error fetching matter statistics:', error.response?.data || error.message);
    throw error;
  }
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/matters/dashboard'); // No need for authConfig()
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error.response?.data || error.message);
    throw error;
  }
};

// Get BASIC dashboard statistics
export const getBasicDashboardStats = async () => {
  try {
    console.log("API Service: Calling /api/matters/dashboard/basic via axiosInstance");
    const response = await axiosInstance.get('/matters/dashboard/basic'); // No need for authConfig()
    console.log("API Service: Received basic stats:", response.data);
    return response.data;
  } catch (error) {
    console.error('API Service: Error fetching basic dashboard statistics:', error.response?.data || error.message);
    throw error;
  }
};

// Add other API functions here, refactored to use axiosInstance
// e.g., for Lawyers, Clients, Users