import { combineReducers } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import assessmentReducer from './slices/assessmentSlice';
import authReducer from './slices/authSlice';
import questionReducer from './slices/questionSlice';

const rootReducer = combineReducers({
  app: appReducer,
  assessment: assessmentReducer,
  auth: authReducer,
  question: questionReducer,
});

export default rootReducer;
