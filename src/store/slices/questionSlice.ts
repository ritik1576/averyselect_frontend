import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Question, PaginatedMeta } from '../../types/models';

export interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  meta: PaginatedMeta | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuestionState = {
  questions: [],
  currentQuestion: null,
  meta: null,
  loading: false,
  error: null,
};

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    fetchQuestionsRequest(state, _action: PayloadAction<{ page?: number; limit?: number; search?: string }>) {
      state.loading = true;
      state.error = null;
    },
    fetchQuestionsSuccess(state, action: PayloadAction<{ data: Question[], meta: PaginatedMeta }>) {
      state.loading = false;
      state.questions = action.payload.data;
      state.meta = action.payload.meta;
    },
    fetchQuestionsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createQuestionRequest(state, _action: PayloadAction<{ data: Partial<Question>; onSuccess?: () => void }>) {
      state.loading = true;
      state.error = null;
    },
    createQuestionSuccess(state, action: PayloadAction<Question>) {
      state.loading = false;
      state.questions.unshift(action.payload);
    },
    createQuestionFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    fetchQuestionByIdRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
      state.currentQuestion = null;
    },
    fetchQuestionByIdSuccess(state, action: PayloadAction<Question>) {
      state.loading = false;
      state.currentQuestion = action.payload;
    },
    fetchQuestionByIdFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateQuestionRequest(state, _action: PayloadAction<{ id: string; data: Partial<Question>; onSuccess?: () => void }>) {
      state.loading = true;
      state.error = null;
    },
    updateQuestionSuccess(state, action: PayloadAction<Question>) {
      state.loading = false;
      state.currentQuestion = action.payload;
      const index = state.questions.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.questions[index] = action.payload;
      }
    },
    updateQuestionFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    deleteQuestionRequest(state, _action: PayloadAction<{ id: string; onSuccess?: () => void }>) {
      state.loading = true;
      state.error = null;
    },
    deleteQuestionSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      state.questions = state.questions.filter(q => q.id !== action.payload);
    },
    deleteQuestionFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchQuestionsRequest,
  fetchQuestionsSuccess,
  fetchQuestionsFailure,
  createQuestionRequest,
  createQuestionSuccess,
  createQuestionFailure,
  fetchQuestionByIdRequest,
  fetchQuestionByIdSuccess,
  fetchQuestionByIdFailure,
  updateQuestionRequest,
  updateQuestionSuccess,
  updateQuestionFailure,
  deleteQuestionRequest,
  deleteQuestionSuccess,
  deleteQuestionFailure,
} = questionSlice.actions;
export default questionSlice.reducer;
