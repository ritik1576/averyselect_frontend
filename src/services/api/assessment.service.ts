import { apiClient } from './client';
import type { Assessment, Candidate } from '../../types';

export const assessmentService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortDir?: string; status?: 'ACTIVE' | 'ARCHIVED' | 'ALL' }): Promise<{ data: Assessment[], meta?: any }> => {
    const response = await apiClient.get('/assessments', { params });
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/assessments/${id}`);
    return response.data;
  },

  archive: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/assessments/${id}/archive`);
    return response.data;
  },

  duplicate: async (id: string): Promise<{ success: boolean; data: Assessment; message: string }> => {
    const response = await apiClient.post(`/assessments/${id}/duplicate`);
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

  updateQuestions: async (assessmentId: string, questionsData: { id: string, points: number }[]): Promise<{ data: Assessment }> => {
    const questions = questionsData.map((q, index) => ({
      questionId: q.id,
      orderIdx: index,
      points: q.points ?? 10,
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
  },

  inviteCandidates: async (
    assessmentId: string,
    candidates: { name?: string; email: string }[]
  ): Promise<{ success: boolean; data: any[]; message: string }> => {
    const response = await apiClient.post(`/assessments/${assessmentId}/invites`, { candidates });
    return response.data;
  },

  getInvites: async (assessmentId: string, options?: { page?: number; limit?: number; search?: string }): Promise<{ success: boolean; data: any[]; meta?: any }> => {
    const response = await apiClient.get(`/assessments/${assessmentId}/invites`, { params: options });
    return response.data;
  },

  resendInvite: async (
    assessmentId: string,
    inviteId: string
  ): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await apiClient.post(`/assessments/${assessmentId}/invites/${inviteId}/resend`);
    return response.data;
  },
};
