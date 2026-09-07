import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { sessionService } from '../../services/api/session.service';
import { candidateService } from '../../services/api/candidate.service';
import {
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
} from '../slices/sessionSlice';

function* handleFetchSessions() {
  try {
    const response: Awaited<ReturnType<typeof sessionService.getAll>> = yield call(sessionService.getAll);
    yield put(fetchSessionsSuccess(response.data));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch sessions';
    yield put(fetchSessionsFailure(message));
  }
}

function* handleFetchSessionReport(action: PayloadAction<string>) {
  try {
    const response: Awaited<ReturnType<typeof sessionService.getReport>> = yield call(sessionService.getReport, action.payload);
    yield put(fetchSessionReportSuccess(response.data));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch session report';
    yield put(fetchSessionReportFailure(message));
  }
}

function* handleStartAssessment(action: PayloadAction<{ token: string; name: string; email: string }>) {
  try {
    const { token, name, email } = action.payload;
    const response: Awaited<ReturnType<typeof candidateService.startAssessment>> = yield call(candidateService.startAssessment, token, { name, email });
    // Save token to localStorage
    if (response.data?.sessionToken) {
      localStorage.setItem('candidateToken', response.data.sessionToken);
      localStorage.setItem('candidate_name', name);
      localStorage.setItem('candidate_email', email);
    }
    yield put(startAssessmentSuccess());
    // The component will navigate to the runner on success.
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to start assessment';
    yield put(startAssessmentFailure(message));
  }
}

function* handleFetchTestPayload(_action: PayloadAction<string>) {
  try {
    // The action.payload used to be the token, but candidateService uses the local storage candidateToken internally.
    const response: Awaited<ReturnType<typeof candidateService.getQuestions>> = yield call(candidateService.getQuestions);
    yield put(fetchTestPayloadSuccess(response.data));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch test payload';
    yield put(fetchTestPayloadFailure(message));
  }
}

function* handleSubmitTest(action: PayloadAction<{ answers: Record<string, any>; selectedLanguages?: Record<string, string> }>) {
  try {
    const { answers, selectedLanguages } = action.payload;
    
    // We assume the user's backend requires us to submit per question, 
    // so we iterate over the answers object and submit them.
    for (const [questionId, answerValue] of Object.entries(answers)) {
      if (!questionId || questionId === 'undefined') continue;
      
      const payload: any = { answer: answerValue };
      
      // If a language was selected for this question, attach it
      if (selectedLanguages && selectedLanguages[questionId]) {
        payload.language = selectedLanguages[questionId];
      }

      yield call(candidateService.submitAttempt, questionId, payload);
    }
    
    // Once all attempts are submitted, we finish the session
    yield call(candidateService.finishSession);
    
    yield put(submitTestSuccess());
    toast.success('Test submitted successfully!');
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to submit test';
    yield put(submitTestFailure(message));
  }
}

export function* sessionSaga() {
  yield takeLatest(fetchSessionsRequest.type, handleFetchSessions);
  yield takeLatest(fetchSessionReportRequest.type, handleFetchSessionReport);
  yield takeLatest(startAssessmentRequest.type, handleStartAssessment);
  yield takeLatest(fetchTestPayloadRequest.type, handleFetchTestPayload);
  yield takeLatest(submitTestRequest.type, handleSubmitTest);
}
