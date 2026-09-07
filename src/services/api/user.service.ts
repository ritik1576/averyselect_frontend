import { apiClient } from './client';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  created_at: string;
}

export interface UpdateUserPayload {
  name?: string;
  password?: string;
}

export const userService = {
  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get('/users/me');
    return response.data.data;
  },
  
  updateMe: async (payload: UpdateUserPayload): Promise<UserResponse> => {
    const response = await apiClient.patch('/users/me', payload);
    return response.data.data;
  }
};
