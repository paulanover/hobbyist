import axios from 'axios';

// Get the backend URL from environment variables or default to HTTPS localhost:5001
// Vite uses import.meta.env.VITE_*
const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api'; // Remove process.env

console.log('API Base URL:', API_URL); // Log the URL being used

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies (like JWT session) with requests
});

// Optional: Add interceptors for logging or error handling
axiosInstance.interceptors.request.use(
  (config) => {
    // You could log requests here if needed
    // console.log('Starting Request', config);
    return config;
  },
  (error) => {
    console.error('Axios request error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // You could log responses here
    // console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Axios response error:', error.response?.data || error.message);
    // Example: Handle unauthorized errors (e.g., redirect to login)
    if (error.response?.status === 401) {
      console.error('Unauthorized access - potentially redirecting to login.');
      // window.location.href = '/login'; // Uncomment to redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
