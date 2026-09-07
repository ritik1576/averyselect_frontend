import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  loginRequest, loginSuccess, loginFailure,
  signupRequest, signupSuccess, signupFailure,
} from '../slices/authSlice';
import type { SignupPayload } from '../slices/authSlice';
import { authService } from '../../services/api/auth.service';
import type { LoginResponse } from '../../services/api/auth.service';

function* handleLogin(action: PayloadAction<{ email: string; password: string }>) {
  try {
    const response: LoginResponse = yield call(authService.login, action.payload);
    yield put(loginSuccess({ token: response.token, user: response.user }));
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Login failed';
    yield put(loginFailure(message));
  }
}

function* handleSignup(action: PayloadAction<SignupPayload>) {
  try {
    const response: LoginResponse = yield call(authService.signup, action.payload);
    yield put(signupSuccess({ token: response.token, user: response.user }));
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Registration failed';
    yield put(signupFailure(message));
  }
}

export function* watchAuthSaga() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(signupRequest.type, handleSignup);
}
