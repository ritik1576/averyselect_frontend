import { describe, it, expect } from 'vitest';
import questionReducer, {
  fetchQuestionsRequest,
  fetchQuestionsSuccess,
  fetchQuestionsFailure,
  createQuestionRequest,
  createQuestionSuccess,
  createQuestionFailure,
} from './questionSlice';
import type { Question } from '../../types/models';

describe('questionSlice reducer', () => {
  const initialState: any = {
    questions: [],
    currentQuestion: null,
    meta: null,
    loading: false,
    error: null,
  };

  it('should handle fetchQuestionsRequest', () => {
    const actual = questionReducer(initialState, fetchQuestionsRequest({}));
    expect(actual.loading).toBe(true);
    expect(actual.error).toBe(null);
  });

  it('should handle fetchQuestionsSuccess', () => {
    const mockQuestions = [
      {
        id: '1',
        title: 'Q1',
        description: 'Desc',
        type: 'MULTIPLE_CHOICE',
        difficulty: 3,
        estimated_time_seconds: 60,
      } as any,
    ];
    const mockMeta = { total: 1, page: 1, limit: 10, totalPages: 1 };

    const actual = questionReducer(initialState, fetchQuestionsSuccess({ data: mockQuestions, meta: mockMeta }));
    expect(actual.loading).toBe(false);
    expect(actual.questions).toEqual(mockQuestions);
  });

  it('should handle fetchQuestionsFailure', () => {
    const actual = questionReducer(initialState, fetchQuestionsFailure('Failed'));
    expect(actual.loading).toBe(false);
    expect(actual.error).toBe('Failed');
  });

  it('should handle createQuestionRequest', () => {
    const payload = { data: { title: 'New Question' } };
    const actual = questionReducer(initialState, createQuestionRequest(payload));
    expect(actual.loading).toBe(true);
    expect(actual.error).toBe(null);
  });

  it('should handle createQuestionSuccess', () => {
    const newQuestion = { id: 'new-id', title: 'New Question' } as Question;
    const actual = questionReducer(initialState, createQuestionSuccess(newQuestion));
    expect(actual.loading).toBe(false);
    expect(actual.questions).toHaveLength(1);
    expect(actual.questions[0].id).toBe('new-id');
  });

  it('should handle createQuestionFailure', () => {
    const actual = questionReducer(initialState, createQuestionFailure('Creation failed'));
    expect(actual.loading).toBe(false);
    expect(actual.error).toBe('Creation failed');
  });
});
