import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { 
  fetchQuestionsRequest, fetchQuestionsSuccess, fetchQuestionsFailure,
  createQuestionRequest, createQuestionSuccess, createQuestionFailure,
  fetchQuestionByIdRequest, fetchQuestionByIdSuccess, fetchQuestionByIdFailure,
  updateQuestionRequest, updateQuestionSuccess, updateQuestionFailure,
  deleteQuestionRequest, deleteQuestionSuccess, deleteQuestionFailure
} from '../slices/questionSlice';
import { questionService } from '../../services/api/question.service';
import type { ApiResponse } from '../../types/api';
// removed QuestionListItem import

function* handleFetchQuestions(action: PayloadAction<any>): Generator<any, void, any> {
  try {
    const response: any = yield call(questionService.getAll, action.payload);
    yield put(fetchQuestionsSuccess({ data: response.data, meta: response.meta }));
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch questions';
    yield put(fetchQuestionsFailure(message));
  }
}

function* handleCreateQuestion(action: PayloadAction<any>): Generator<any, void, any> {
  try {
    const payloadData = action.payload.data || action.payload;
    const response: ApiResponse<any> = yield call(questionService.create, payloadData);
    yield put(createQuestionSuccess(response.data));
    
    if (action.payload.onSuccess) {
      yield call(action.payload.onSuccess);
    }
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to create question';
    yield put(createQuestionFailure(message));
  }
}

function* handleFetchQuestionById(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const response: ApiResponse<any> = yield call(questionService.getById, action.payload);
    yield put(fetchQuestionByIdSuccess(response.data));
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch question details';
    yield put(fetchQuestionByIdFailure(message));
    toast.error(message);
  }
}

function* handleUpdateQuestion(action: PayloadAction<{ id: string; data: any; onSuccess?: () => void }>): Generator<any, void, any> {
  try {
    const response: ApiResponse<any> = yield call(questionService.update, action.payload.id, action.payload.data);
    yield put(updateQuestionSuccess(response.data));
    toast.success('Question updated successfully!');
    if (action.payload.onSuccess) {
      yield call(action.payload.onSuccess);
    }
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to update question';
    yield put(updateQuestionFailure(message));
    toast.error(message);
  }
}

function* handleDeleteQuestion(action: PayloadAction<{ id: string; onSuccess?: () => void }>): Generator<any, void, any> {
  try {
    yield call(questionService.delete, action.payload.id);
    yield put(deleteQuestionSuccess(action.payload.id));
    toast.success('Question deleted successfully!');
    if (action.payload.onSuccess) {
      yield call(action.payload.onSuccess);
    }
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to delete question';
    yield put(deleteQuestionFailure(message));
    toast.error(message);
  }
}

export function* watchQuestionSaga() {
  yield takeLatest(fetchQuestionsRequest.type, handleFetchQuestions);
  yield takeLatest(createQuestionRequest.type, handleCreateQuestion);
  yield takeLatest(fetchQuestionByIdRequest.type, handleFetchQuestionById);
  yield takeLatest(updateQuestionRequest.type, handleUpdateQuestion);
  yield takeLatest(deleteQuestionRequest.type, handleDeleteQuestion);
}
