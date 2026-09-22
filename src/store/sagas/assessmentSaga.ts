import toast from 'react-hot-toast';
import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { 
  updateAssessmentRequest, updateAssessmentSuccess, updateAssessmentFailure,
  fetchAssessmentsRequest, fetchAssessmentsSuccess, fetchAssessmentsFailure,
  updateAssessmentQuestionsRequest, updateAssessmentQuestionsSuccess, updateAssessmentQuestionsFailure,
  fetchBankQuestionsRequest, fetchBankQuestionsSuccess, fetchBankQuestionsFailure,
  deleteAssessmentRequest, deleteAssessmentSuccess, deleteAssessmentFailure,
  archiveAssessmentRequest, archiveAssessmentSuccess, archiveAssessmentFailure,
  duplicateAssessmentRequest, duplicateAssessmentSuccess, duplicateAssessmentFailure
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
    if (error.response?.status === 409) {
      toast.error(message, { duration: 5000, id: 'edit-conflict' });
    }
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

function* handleUpdateAssessmentQuestions(action: PayloadAction<{ id: string; questions: { id: string; points: number }[] }>): Generator<any, void, any> {
  try {
    const { id, questions } = action.payload;
    yield call(assessmentService.updateQuestions, id, questions);
    yield put(updateAssessmentQuestionsSuccess());
    toast.success('Structure saved successfully!');
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to update test questions';
    yield put(updateAssessmentQuestionsFailure(message));
    if (error.response?.status === 409) {
      toast.error(message, { duration: 5000, id: 'edit-conflict' });
    } else {
      toast.error(message);
    }
  }
}

function* handleDeleteAssessment(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    yield call(assessmentService.delete, action.payload);
    yield put(deleteAssessmentSuccess(action.payload));
    toast.success('Test deleted successfully!');
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to delete test';
    yield put(deleteAssessmentFailure(message));
    toast.error(message);
  }
}

function* handleArchiveAssessment(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    yield call(assessmentService.archive, action.payload);
    yield put(archiveAssessmentSuccess(action.payload));
    toast.success('Test archived successfully!');
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to archive test';
    yield put(archiveAssessmentFailure(message));
    toast.error(message);
  }
}

function* handleDuplicateAssessment(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const response: { data: Assessment } = yield call(assessmentService.duplicate, action.payload);
    yield put(duplicateAssessmentSuccess(response.data));
    toast.success('Test duplicated successfully!');
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to duplicate test';
    yield put(duplicateAssessmentFailure(message));
    toast.error(message);
  }
}

export function* watchAssessmentSaga() {
  yield takeLatest(updateAssessmentRequest.type, handleUpdateAssessment);
  yield takeLatest(fetchAssessmentsRequest.type, handleFetchAssessments);
  yield takeLatest(fetchBankQuestionsRequest.type, handleFetchBankQuestions);
  yield takeLatest(updateAssessmentQuestionsRequest.type, handleUpdateAssessmentQuestions);
  yield takeLatest(deleteAssessmentRequest.type, handleDeleteAssessment);
  yield takeLatest(archiveAssessmentRequest.type, handleArchiveAssessment);
  yield takeLatest(duplicateAssessmentRequest.type, handleDuplicateAssessment);
}
