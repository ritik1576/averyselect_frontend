import { all, fork } from 'redux-saga/effects';
import { watchAppSaga } from './sagas/appSaga';
import { watchAuthSaga } from './sagas/authSaga';
import { watchAssessmentSaga } from './sagas/assessmentSaga';
import { watchQuestionSaga } from './sagas/questionSaga';
import { sessionSaga } from './sagas/sessionSaga';

export default function* rootSaga() {
  yield all([
    fork(watchAppSaga),
    fork(watchAuthSaga),
    fork(watchAssessmentSaga),
    fork(watchQuestionSaga),
    fork(sessionSaga),
  ]);
}
