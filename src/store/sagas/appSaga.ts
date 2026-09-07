import { put, takeLatest, delay } from 'redux-saga/effects';
import { initializeApp, initializeAppSuccess, initializeAppFailure } from '../slices/appSlice';

function* handleInitializeApp() {
  try {
    // Simulate async initialization tasks (e.g. fetching config, checking auth)
    yield delay(500); 
    yield put(initializeAppSuccess());
  } catch (error: any) {
    yield put(initializeAppFailure(error.message || 'Failed to initialize app'));
  }
}

export function* watchAppSaga() {
  yield takeLatest(initializeApp.type, handleInitializeApp);
}
