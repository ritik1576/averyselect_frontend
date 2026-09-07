import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface SignupPayload {
  companyName: string;
  userName: string;
  email: string;
  password: string;
}

export interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
let user = null;
try {
  user = userStr ? JSON.parse(userStr) : null;
} catch (e) {
  user = null;
}

const initialState: AuthState = {
  token: token || null,
  user: user || null,
  isAuthenticated: !!token,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest(state, _action: PayloadAction<{ email: string; password: string }>) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ token: string; user: any }>) {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    signupRequest(state, _action: PayloadAction<SignupPayload>) {
      state.loading = true;
      state.error = null;
    },
    signupSuccess(state, action: PayloadAction<{ token: string; user: any }>) {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    signupFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser(state, action: PayloadAction<any>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { loginRequest, loginSuccess, loginFailure, signupRequest, signupSuccess, signupFailure, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
