import { describe, it, expect } from 'vitest';
import assessmentReducer, {
  fetchAssessmentsRequest,
  fetchAssessmentsSuccess,
  fetchAssessmentsFailure,
  addQuestionToTest,
  updateAssessmentQuestionsRequest,
  updateAssessmentQuestionsSuccess,
  updateAssessmentQuestionsFailure,
} from './assessmentSlice';
import type { AssessmentListItem, QuestionListItem } from '../../types';

describe('assessmentSlice reducer', () => {
  const initialState: any = {
    tests: [],
    loading: false,
    error: null,
    bankQuestions: [],
    selectedQuestions: [],
    hasUnsavedChanges: false,
    totalItems: 0,
  };

  it('should handle fetchAssessmentsRequest', () => {
    const actual = assessmentReducer(initialState, fetchAssessmentsRequest());
    expect(actual.loading).toBe(true);
    expect(actual.error).toBe(null);
  });

  it('should handle fetchAssessmentsSuccess', () => {
    const mockAssessments: AssessmentListItem[] = [
      {
        id: '1',
        title: 'Test 1',
        description: '',
        duration_minutes: 60,
        language: 'English',
        status: 'published',
        company_id: 'c1',
        created_at: '',
        updated_at: '',
        candidate_count: 5,
        domain_tags: ['React'],
      },
    ];

    const actual = assessmentReducer(initialState, fetchAssessmentsSuccess({ data: mockAssessments, totalItems: 1 }));
    expect(actual.loading).toBe(false);
    expect(actual.tests).toEqual(mockAssessments);
  });

  it('should handle fetchAssessmentsFailure', () => {
    const actual = assessmentReducer(initialState, fetchAssessmentsFailure('Network Error'));
    expect(actual.loading).toBe(false);
    expect(actual.error).toBe('Network Error');
  });

  it('should handle addQuestionToTest', () => {
    const questionId = 'q1';
    const mockQuestion = { id: questionId, title: 'Q1' } as QuestionListItem;
    
    const stateWithBank = {
      ...initialState,
      bankQuestions: [mockQuestion],
    };

    const actual = assessmentReducer(stateWithBank, addQuestionToTest(questionId));
    
    // Should move from bank to selected
    expect(actual.bankQuestions.length).toBe(0);
    expect(actual.selectedQuestions.length).toBe(1);
    expect(actual.selectedQuestions[0].id).toBe(questionId);
    expect(actual.hasUnsavedChanges).toBe(true);
  });

  it('should handle updateAssessmentQuestionsRequest', () => {
    const actual = assessmentReducer(initialState, updateAssessmentQuestionsRequest({ id: 'test1', questionIds: ['q2'] }));
    expect(actual.loading).toBe(true);
    expect(actual.error).toBe(null);
  });

  it('should handle updateAssessmentQuestionsSuccess', () => {
    const stateWithChanges = { ...initialState, hasUnsavedChanges: true, loading: true };
    const actual = assessmentReducer(stateWithChanges, updateAssessmentQuestionsSuccess());
    expect(actual.loading).toBe(false);
    expect(actual.hasUnsavedChanges).toBe(false);
  });

  it('should handle updateAssessmentQuestionsFailure', () => {
    const actual = assessmentReducer(initialState, updateAssessmentQuestionsFailure('Error'));
    expect(actual.loading).toBe(false);
    expect(actual.error).toBe('Error');
  });
});
