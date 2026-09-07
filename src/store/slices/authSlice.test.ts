import { describe, it, expect } from 'vitest';
import authReducer, { loginRequest, loginSuccess, loginFailure, logout } from './authSlice';

describe('authSlice reducer', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle loginRequest', () => {
    const actual = authReducer(initialState, loginRequest({ email: 'test@test.com', password: 'password' }));
    expect(actual.loading).toEqual(true);
    expect(actual.error).toEqual(null);
  });

  it('should handle loginSuccess', () => {
    const userPayload = {
      token: 'fake-jwt-token',
      user: { id: '1', name: 'John Doe', email: 'john@test.com', role: 'admin', company_id: '123' }
    };
    const actual = authReducer(initialState, loginSuccess(userPayload));
    
    expect(actual.loading).toEqual(false);
    expect(actual.isAuthenticated).toEqual(true);
    expect(actual.token).toEqual('fake-jwt-token');
    expect(actual.user?.name).toEqual('John Doe');
  });

  it('should handle loginFailure', () => {
    const actual = authReducer(initialState, loginFailure('Invalid credentials'));
    expect(actual.loading).toEqual(false);
    expect(actual.isAuthenticated).toEqual(false);
    expect(actual.error).toEqual('Invalid credentials');
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: { id: '1', name: 'John Doe', email: 'john@test.com', role: 'admin', company_id: '123' },
      token: 'fake-jwt-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    
    const actual = authReducer(loggedInState, logout());
    expect(actual.isAuthenticated).toEqual(false);
    expect(actual.user).toEqual(null);
    expect(actual.token).toEqual(null);
  });
});
