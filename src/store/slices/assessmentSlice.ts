import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Question, Assessment } from '../../types/models';

// ─── Question with runtime display_order ─────────────────────────────────────
export interface AssessmentQuestion extends Question {
  display_order: number;
  points: number;
}

export interface UpdateAssessmentParams {
  id: string;
  data: Partial<Assessment>;
}

export interface FetchAssessmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: string;
}

interface AssessmentBuilderState {
  bankQuestions: Question[];
  selectedQuestions: AssessmentQuestion[];
  tests: Assessment[];
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  totalItems: number;
}

// Remove mock initial bank questions so it's fully dynamic
const initialState: AssessmentBuilderState = {
  bankQuestions: [],
  selectedQuestions: [],
  tests: [],
  loading: false,
  error: null,
  hasUnsavedChanges: false,
  totalItems: 0,
};

const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {
    updateAssessmentRequest(state, _action: PayloadAction<UpdateAssessmentParams>) {
      state.loading = true;
      state.error = null;
    },
    updateAssessmentSuccess(state, action: PayloadAction<Assessment>) {
      state.loading = false;
      // state.currentAssessment doesn't exist anymore in the slice, just update in list if present
      const index = state.tests.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.tests[index] = { ...state.tests[index], ...action.payload };
      }
    },
    updateAssessmentFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    fetchAssessmentsRequest(state, _action: PayloadAction<FetchAssessmentsParams | undefined>) {
      state.loading = true;
      state.error = null;
    },
    fetchAssessmentsSuccess(state, action: PayloadAction<{ data: any[]; totalItems: number }>) {
      state.loading = false;
      state.tests = action.payload.data.map(t => ({
        ...t,
        candidate_count: t._count?.sessions || 0
      }));
      state.totalItems = action.payload.totalItems;
    },
    fetchAssessmentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    fetchBankQuestionsRequest(state, _action: PayloadAction<{ search?: string; type?: string; page?: number; limit?: number } | void>) {
      state.loading = true;
      state.error = null;
    },
    fetchBankQuestionsSuccess(state, action: PayloadAction<Question[]>) {
      state.loading = false;
      const selectedIds = new Set(state.selectedQuestions.map((q) => q.id));
      state.bankQuestions = action.payload.filter((q) => !selectedIds.has(q.id));
    },
    fetchBankQuestionsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    // Add question from bank to test
    addQuestionToTest(state, action: PayloadAction<string>) {
      const qId = action.payload;
      const idx = state.bankQuestions.findIndex((q) => q.id === qId);
      if (idx !== -1) {
        const question = state.bankQuestions[idx];
        state.bankQuestions.splice(idx, 1);
        state.selectedQuestions.push({
          ...question,
          display_order: state.selectedQuestions.length,
          points: 10,
        });
        state.hasUnsavedChanges = true;
      }
    },
    // Remove question from test back to bank
    removeQuestionFromTest(state, action: PayloadAction<string>) {
      const qId = action.payload;
      const idx = state.selectedQuestions.findIndex((q) => q.id === qId);
      if (idx !== -1) {
        const question = state.selectedQuestions[idx];
        state.selectedQuestions.splice(idx, 1);
        // Fix display orders
        state.selectedQuestions.forEach((q, i) => {
          q.display_order = i;
        });
        state.bankQuestions.push(question);
        state.hasUnsavedChanges = true;
      }
    },
    // Reorder questions in the test (drag and drop)
    reorderTestQuestions(state, action: PayloadAction<{ activeId: string; overId: string }>) {
      const { activeId, overId } = action.payload;
      const activeIndex = state.selectedQuestions.findIndex((q) => q.id === activeId);
      const overIndex = state.selectedQuestions.findIndex((q) => q.id === overId);
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const [removed] = state.selectedQuestions.splice(activeIndex, 1);
        state.selectedQuestions.splice(overIndex, 0, removed);
        // Fix display orders
        state.selectedQuestions.forEach((q, i) => {
          q.display_order = i;
        });
        state.hasUnsavedChanges = true;
      }
    },
    // Update points for a specific question in the test
    updateQuestionPoints(state, action: PayloadAction<{ questionId: string; points: number }>) {
      const { questionId, points } = action.payload;
      const q = state.selectedQuestions.find((q) => q.id === questionId);
      if (q) {
        q.points = points;
        state.hasUnsavedChanges = true;
      }
    },
    setTestQuestions(state, action: PayloadAction<any[]>) {
      // Map backend AssessmentQuestion (with nested .question) to frontend AssessmentQuestion
      state.selectedQuestions = action.payload.map((q: any) => ({
        ...q.question,
        display_order: q.orderIdx,
        points: q.points,
        // Map backend type MULTIPLE_CHOICE -> mcq, etc.
        type: q.question.type === 'MULTIPLE_CHOICE' ? 'mcq' : q.question.type === 'CODING' ? 'coding' : 'free_text',
        question_type: q.question.type === 'MULTIPLE_CHOICE' ? 'mcq' : q.question.type === 'CODING' ? 'coding' : 'free_text',
        description: q.question.text || q.question.description,
      }));
      // Filter out from bankQuestions
      const selectedIds = new Set(state.selectedQuestions.map((q) => q.id));
      state.bankQuestions = state.bankQuestions.filter((bq) => !selectedIds.has(bq.id));
      state.hasUnsavedChanges = false;
    },
    updateAssessmentQuestionsRequest(state, _action: PayloadAction<{ id: string; questionIds: string[] }>) {
      state.loading = true;
      state.error = null;
    },
    updateAssessmentQuestionsSuccess(state) {
      state.loading = false;
      state.hasUnsavedChanges = false;
    },
    updateAssessmentQuestionsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  updateAssessmentRequest,
  updateAssessmentSuccess,
  updateAssessmentFailure,
  fetchAssessmentsRequest,
  fetchAssessmentsSuccess,
  fetchAssessmentsFailure,
  fetchBankQuestionsRequest,
  fetchBankQuestionsSuccess,
  fetchBankQuestionsFailure,
  setTestQuestions,
  addQuestionToTest,
  removeQuestionFromTest,
  reorderTestQuestions,
  updateQuestionPoints,
  updateAssessmentQuestionsRequest,
  updateAssessmentQuestionsSuccess,
  updateAssessmentQuestionsFailure,
} = assessmentSlice.actions;

export default assessmentSlice.reducer;
