import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Candidate Token
publicApiClient.interceptors.request.use(
  (config) => {
    // We use a different local storage key so we don't mess up recruiter sessions
    const token = localStorage.getItem('candidateToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors globally without logging out recruiters
publicApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Determine the error message
    let message = error.response?.data?.message || 'A network error occurred. Please try again.';

    // If we have an array of Zod validation errors, extract their messages and join them
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const validationMessages = error.response.data.errors.map((err: any) => {
        if (err.message) return err.message;
        return 'Invalid input';
      });
      message = validationMessages.join(', ');
    }

    if (error.response?.status === 401) {
      // Clear candidate token
      localStorage.removeItem('candidateToken');
      localStorage.removeItem('candidate_name');
      localStorage.removeItem('candidate_email');
      toast.error('Test session expired or invalid.');
      // We don't force redirect here because we don't know the test token.
      // The UI components should handle the missing candidateToken.
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);
