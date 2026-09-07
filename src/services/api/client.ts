import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Determine the error message
    let message = error.response?.data?.message || 'A network error occurred. Please try again.';
    
    // If we have an array of Zod validation errors, extract their messages and join them
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const validationMessages = error.response.data.errors.map((err: any) => {
        // Zod sometimes sends { path: ['field'], message: 'error' }
        if (err.message) return err.message;
        return 'Invalid input';
      });
      message = validationMessages.join(', ');
    }

    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
    } else {
      // Clean up technical messages to look world-class
      if (message.includes('Route') && message.includes('not found')) {
        message = 'The requested resource could not be found or is unavailable.';
      } else if (message.includes('Internal Server Error')) {
        message = 'An unexpected error occurred. Please try again later.';
      } else if (message.includes('ECONNREFUSED') || message.includes('Network Error')) {
        message = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);
