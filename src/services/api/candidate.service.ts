import { publicApiClient } from './publicClient';
import type { ApiResponse } from '../../types/api';
import type { Question } from '../../types';

export const candidateService = {
  getAssessmentInfo: async (token: string) => {
    const response = await publicApiClient.get(`/public/assessments/${token}`);
    return response.data;
  },

  // Start the assessment and get the session JWT
  startAssessment: async (
    token: string, 
    data: { name: string; email: string }
  ): Promise<ApiResponse<{ sessionToken: string }>> => {
    const response = await publicApiClient.post(`/public/assessments/${token}/start`, data);
    return response.data; // Assuming it returns { success: true, data: { sessionToken: '...' } }
  },

  // Get test payload (questions) for a candidate
  getQuestions: async (): Promise<ApiResponse<Question[]>> => {
    const response = await publicApiClient.get('/public/sessions/questions');
    // We map camelCase to snake_case if backend sends camelCase
    // We'll just return response.data for now and assume it matches Question[]
    // Wait, the backend probably sends camelCase questions!
    // We will do a generic map just in case.
    const questions = response.data.data.map((q: any) => {
      // Map MULTIPLE_CHOICE -> mcq, CODING -> code, TEXT -> free_text
      let frontendType = q.type;
      if (q.type === 'MULTIPLE_CHOICE') frontendType = 'mcq';
      if (q.type === 'CODING') frontendType = 'code';
      if (q.type === 'TEXT') frontendType = 'free_text';

      // Map options to include 'label' (A, B, C, D)
      let mappedOptions = q.options;
      if (mappedOptions && Array.isArray(mappedOptions)) {
        mappedOptions = mappedOptions.map((opt: any, idx: number) => ({
          ...opt,
          label: String.fromCharCode(65 + idx), // A, B, C...
        }));
      }

      return {
        ...q,
        id: q.questionId || q.id,
        type: frontendType,
        question_type: frontendType,
        description: q.text || q.description,
        options: mappedOptions,
        estimated_time_seconds: q.estimatedTimeSeconds || q.estimated_time_seconds,
      };
    });
    return { data: questions, success: true };
  },

  // Submit test attempt for a specific question
  submitAttempt: async (
    questionId: string, 
    answerPayload: any
  ): Promise<ApiResponse<void>> => {
    // We assume answerPayload contains either { answer: '...' } or { code: '...' } based on user's API
    const response = await publicApiClient.post(`/public/sessions/questions/${questionId}/attempt`, answerPayload);
    return response.data;
  },

  // Submit/Finish the test
  finishSession: async (): Promise<ApiResponse<void>> => {
    const response = await publicApiClient.post('/public/sessions/finish');
    return response.data;
  },

  // Log security and activity events
  logEvent: async (eventType: string, details: any = {}): Promise<ApiResponse<void>> => {
    const response = await publicApiClient.post('/public/sessions/events', { eventType, details });
    return response.data;
  },
};
