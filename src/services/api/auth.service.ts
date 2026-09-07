import { apiClient } from './client';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authService = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data.data;
  },
  
  signup: async (userData: any): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data.data;
  },
  
  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/users/me');
    return response.data.data;
  },
  
  updateProfile: async (userData: any): Promise<any> => {
    const response = await apiClient.patch('/users/me', userData);
    return response.data.data;
  }
};
