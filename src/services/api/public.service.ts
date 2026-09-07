import { apiClient } from './client';

export const publicService = {
  getAssessmentInfo: async (token: string) => {
    const response = await apiClient.get(`/public/assessments/${token}`);
    return response.data;
  },

  startSession: async (token: string, data: any) => {
    const response = await apiClient.post(`/public/assessments/${token}/start`, data);
    return response.data;
  },

  getSessionQuestions: async (sessionId: string) => {
    // Assuming backend takes session token in header or body, 
    // For now we'll pass it in header manually since public API doesn't use standard recruiter token
    const response = await apiClient.get('/public/sessions/questions', {
      headers: {
        'x-session-token': sessionId
      }
    });
    return response.data;
  },

  submitAttempt: async (sessionId: string, questionId: string, data: any) => {
    const response = await apiClient.post(`/public/sessions/questions/${questionId}/attempt`, data, {
      headers: {
        'x-session-token': sessionId
      }
    });
    return response.data;
  },

  logEvent: async (sessionId: string, eventData: any) => {
    const response = await apiClient.post('/public/sessions/events', eventData, {
      headers: {
        'x-session-token': sessionId
      }
    });
    return response.data;
  },

  finishSession: async (sessionId: string) => {
    const response = await apiClient.post('/public/sessions/finish', {}, {
      headers: {
        'x-session-token': sessionId
      }
    });
    return response.data;
  }
};
