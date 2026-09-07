import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  isInitialized: false,
  loading: false,
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    initializeApp(state) {
      state.loading = true;
    },
    initializeAppSuccess(state) {
      state.loading = false;
      state.isInitialized = true;
      state.error = null;
    },
    initializeAppFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { initializeApp, initializeAppSuccess, initializeAppFailure } = appSlice.actions;
export default appSlice.reducer;
