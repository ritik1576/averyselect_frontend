import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CandidateSessionListItem, Question, SessionReport } from '../../types';

export interface SessionState {
  sessions: CandidateSessionListItem[];
  sessionReport: SessionReport | null;
  testPayload: Question[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  sessions: [],
  sessionReport: null,
  testPayload: null,
  loading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    fetchSessionsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSessionsSuccess(state, action: PayloadAction<CandidateSessionListItem[]>) {
      state.loading = false;
      state.sessions = action.payload;
    },
    fetchSessionsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchSessionReportRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
      state.sessionReport = null;
    },
    fetchSessionReportSuccess(state, action: PayloadAction<SessionReport>) {
      state.loading = false;
      state.sessionReport = action.payload;
    },
    fetchSessionReportFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchTestPayloadRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
      state.testPayload = null;
    },
    fetchTestPayloadSuccess(state, action: PayloadAction<Question[]>) {
      state.loading = false;
      state.testPayload = action.payload;
    },
    fetchTestPayloadFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    submitTestRequest(state, _action: PayloadAction<{ answers: Record<string, any>; selectedLanguages?: Record<string, string> }>) {
      state.loading = true;
      state.error = null;
    },
    submitTestSuccess(state) {
      state.loading = false;
    },
    submitTestFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    
    startAssessmentRequest(state, _action: PayloadAction<{ token: string; name: string; email: string }>) {
      state.loading = true;
      state.error = null;
    },
    startAssessmentSuccess(state) {
      state.loading = false;
    },
    startAssessmentFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchSessionsRequest,
  fetchSessionsSuccess,
  fetchSessionsFailure,
  fetchSessionReportRequest,
  fetchSessionReportSuccess,
  fetchSessionReportFailure,
  fetchTestPayloadRequest,
  fetchTestPayloadSuccess,
  fetchTestPayloadFailure,
  submitTestRequest,
  submitTestSuccess,
  submitTestFailure,
  startAssessmentRequest,
  startAssessmentSuccess,
  startAssessmentFailure,
} = sessionSlice.actions;

export default sessionSlice.reducer;
