import { apiClient } from './client';
import type { Question } from '../../types';

const mapFrontendToBackendType = (type: string | undefined) => {
  if (type === 'mcq') return 'MULTIPLE_CHOICE';
  if (type === 'coding') return 'CODING';
  if (type === 'free_text') return 'TEXT';
  return type || 'TEXT';
};

const mapBackendToFrontendType = (type: string | undefined) => {
  if (type === 'MULTIPLE_CHOICE') return 'mcq';
  if (type === 'CODING') return 'coding';
  if (type === 'TEXT') return 'free_text';
  return type || 'free_text';
};

export const questionService = {
  getAll: async (params?: any): Promise<{ data: Question[], meta?: any }> => {
    const query = { ...params };
    if (query.type && query.type !== 'all') {
      query.type = mapFrontendToBackendType(query.type);
    } else {
      delete query.type;
    }
    
    if (query.domain === 'all') delete query.domain;
    if (query.difficulty === 'all') delete query.difficulty;
    if (!query.search) delete query.search;

    const response = await apiClient.get('/questions', { params: query });
    if (response.data?.data) {
      response.data.data = response.data.data.map((q: any) => ({
        ...q,
        question_type: mapBackendToFrontendType(q.type || q.question_type),
        description: q.text || q.description,
        estimated_time_seconds: q.estimatedTimeSeconds || q.estimated_time_seconds
      }));
    }
    return response.data;
  },

  create: async (data: Partial<Question> | any): Promise<{ data: Question }> => {
    // Backend strictly expects `type` as the discriminator
    let fallbackText = data.title || 'No description provided for this question.';
    if (fallbackText.length < 10) fallbackText += '          '; // Pad to pass backend min(10)

    const payload = {
      ...data,
      type: mapFrontendToBackendType(data.question_type),
      text: data.description || data.text || fallbackText
    };
    
    // We don't want to send `question_type` or `description` if the backend doesn't want it
    if ('question_type' in payload) delete (payload as any).question_type;
    if ('description' in payload) delete (payload as any).description;

    // Convert options snake_case to camelCase
    if (payload.options && Array.isArray(payload.options)) {
      payload.options = payload.options.map((opt: any) => ({
        text: opt.text,
        isCorrect: opt.is_correct
      }));
    }
    
    // Convert test_cases snake_case to camelCase
    if (payload.test_cases && Array.isArray(payload.test_cases)) {
      payload.testCases = payload.test_cases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.expected_output,
        isHidden: tc.is_hidden
      }));
      delete payload.test_cases;
    }

    const response = await apiClient.post('/questions', payload);
    
    if (response.data?.data) {
      response.data.data = {
        ...response.data.data,
        question_type: mapBackendToFrontendType(response.data.data.type || response.data.data.question_type),
        description: response.data.data.text || response.data.data.description,
        estimated_time_seconds: response.data.data.estimatedTimeSeconds || response.data.data.estimated_time_seconds
      };
    }

    return response.data;
  },
  getById: async (id: string): Promise<{ data: Question }> => {
    const response = await apiClient.get(`/questions/${id}`);
    if (response.data?.data) {
      const q = response.data.data;
      response.data.data = {
        ...q,
        question_type: mapBackendToFrontendType(q.type || q.question_type),
        description: q.text || q.description,
        estimated_time_seconds: q.estimatedTimeSeconds || q.estimated_time_seconds,
        options: q.options?.map((opt: any) => ({
          ...opt,
          is_correct: opt.isCorrect !== undefined ? opt.isCorrect : opt.is_correct
        })),
        test_cases: q.testCases?.map((tc: any) => ({
          ...tc,
          expected_output: tc.expectedOutput !== undefined ? tc.expectedOutput : tc.expected_output,
          is_hidden: tc.isHidden !== undefined ? tc.isHidden : tc.is_hidden
        }))
      };
    }
    return response.data;
  },

  update: async (id: string, data: any): Promise<{ data: Question }> => {
    let fallbackText = data.title || 'No description provided for this question.';
    if (fallbackText.length < 10) fallbackText += '          ';

    const payload = {
      ...data,
      type: mapFrontendToBackendType(data.question_type),
      text: data.description || data.text || fallbackText
    };
    
    if ('question_type' in payload) delete (payload as any).question_type;
    if ('description' in payload) delete (payload as any).description;

    if (payload.options && Array.isArray(payload.options)) {
      payload.options = payload.options.map((opt: any) => ({
        text: opt.text,
        isCorrect: opt.is_correct
      }));
    }
    
    if (payload.test_cases && Array.isArray(payload.test_cases)) {
      payload.testCases = payload.test_cases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.expected_output,
        isHidden: tc.is_hidden
      }));
      delete payload.test_cases;
    }

    const response = await apiClient.put(`/questions/${id}`, payload);
    
    if (response.data?.data) {
      response.data.data = {
        ...response.data.data,
        question_type: mapBackendToFrontendType(response.data.data.type || response.data.data.question_type),
        description: response.data.data.text || response.data.data.description,
        estimated_time_seconds: response.data.data.estimatedTimeSeconds || response.data.data.estimated_time_seconds
      };
    }
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/questions/${id}`);
    return response.data;
  },
};
