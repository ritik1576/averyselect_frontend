import { apiClient } from './client';
import type { Assessment, Candidate } from '../../types';

export const assessmentService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortDir?: string }): Promise<{ data: Assessment[], meta?: any }> => {
    const response = await apiClient.get('/assessments', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ data: Assessment }> => {
    const response = await apiClient.get(`/assessments/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<{ data: Assessment }> => {
    const response = await apiClient.post('/assessments', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<{ data: Assessment }> => {
    const response = await apiClient.put(`/assessments/${id}`, data);
    return response.data;
  },

  updateQuestions: async (assessmentId: string, questionIds: string[]): Promise<{ data: Assessment }> => {
    const questions = questionIds.map((id, index) => ({
      questionId: id,
      orderIdx: index,
      points: 10,
    }));
    const response = await apiClient.put(`/assessments/${assessmentId}`, { questions });
    return response.data;
  },

  getResults: async (id: string): Promise<{ data: Candidate[] }> => {
    const response = await apiClient.get(`/assessments/${id}/results`);
    return response.data;
  },

  getLinks: async (id: string): Promise<{ data: any[] }> => {
    const response = await apiClient.get(`/assessments/${id}/links`);
    return response.data;
  },

  createLink: async (id: string): Promise<{ data: any }> => {
    const response = await apiClient.post(`/assessments/${id}/links`);
    return response.data;
  }
};
