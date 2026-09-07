import toast from 'react-hot-toast';
import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { 
  updateAssessmentRequest, updateAssessmentSuccess, updateAssessmentFailure,
  fetchAssessmentsRequest, fetchAssessmentsSuccess, fetchAssessmentsFailure,
  updateAssessmentQuestionsRequest, updateAssessmentQuestionsSuccess, updateAssessmentQuestionsFailure,
  fetchBankQuestionsRequest, fetchBankQuestionsSuccess, fetchBankQuestionsFailure
} from '../slices/assessmentSlice';
import { assessmentService } from '../../services/api/assessment.service';
import { questionService } from '../../services/api/question.service';
import type { Question, Assessment } from '../../types/models';
import type { FetchAssessmentsParams } from '../slices/assessmentSlice';

function* handleUpdateAssessment(action: PayloadAction<any>): Generator<any, void, any> {
  try {
    const { id, data } = action.payload;
    const response: { data: Assessment } = yield call(assessmentService.update, id, data);
    yield put(updateAssessmentSuccess(response.data));
    toast.success('Settings saved successfully!');
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to update assessment';
    yield put(updateAssessmentFailure(message));
    toast.error(message);
  }
}

function* handleFetchAssessments(action: PayloadAction<FetchAssessmentsParams | undefined>): Generator<any, void, any> {
  try {
    const response = yield call(assessmentService.getAll, action.payload);
    yield put(fetchAssessmentsSuccess({ data: response.data, totalItems: response.meta?.total || response.data.length }));
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch assessments';
    yield put(fetchAssessmentsFailure(message));
  }
}

function* handleFetchBankQuestions(action: PayloadAction<{ search?: string; type?: string; page?: number; limit?: number } | void>): Generator<any, void, any> {
  try {
    const response: { data: Question[] } = yield call(questionService.getAll, action.payload);
    yield put(fetchBankQuestionsSuccess(response.data));
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch question bank';
    yield put(fetchBankQuestionsFailure(message));
  }
}

function* handleUpdateAssessmentQuestions(action: PayloadAction<{ id: string; questionIds: string[] }>): Generator<any, void, any> {
  try {
    const { id, questionIds } = action.payload;
    yield call(assessmentService.updateQuestions, id, questionIds);
    yield put(updateAssessmentQuestionsSuccess());
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to update test questions';
    yield put(updateAssessmentQuestionsFailure(message));
  }
}

export function* watchAssessmentSaga() {
  yield takeLatest(updateAssessmentRequest.type, handleUpdateAssessment);
  yield takeLatest(fetchAssessmentsRequest.type, handleFetchAssessments);
  yield takeLatest(fetchBankQuestionsRequest.type, handleFetchBankQuestions);
  yield takeLatest(updateAssessmentQuestionsRequest.type, handleUpdateAssessmentQuestions);
}
