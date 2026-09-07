import { describe, it, expect } from 'vitest';
import reducer, {
  fetchSessionsRequest,
  fetchSessionsSuccess,
  fetchSessionsFailure,
} from './sessionSlice';
import type { SessionState } from './sessionSlice';
import type { CandidateSessionListItem } from '../../types';

describe('sessionSlice', () => {
  const initialState: SessionState = {
    sessions: [],
    sessionReport: null,
    testPayload: null,
    loading: false,
    error: null,
  };

  it('should handle initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle fetchSessionsRequest', () => {
    const actual = reducer(initialState, fetchSessionsRequest());
    expect(actual.loading).toBe(true);
    expect(actual.error).toBeNull();
  });

  it('should handle fetchSessionsSuccess', () => {
    const mockSessions: CandidateSessionListItem[] = [
      {
        session_id: '1',
        assessment_id: 'test_1',
        assessment_title: 'Test',
        assessment_created_at: '2026-07-01',
        started_at: '2026-07-02',
        candidate_id: 'c1',
        candidate_name: 'John Doe',
        candidate_email: 'john@example.com',
        total_score: 100,
        max_score: 100,
        percentage: 100,
        status: 'completed',
      },
    ];
    const state = reducer(
      { ...initialState, loading: true },
      fetchSessionsSuccess(mockSessions)
    );
    expect(state.loading).toBe(false);
    expect(state.sessions).toEqual(mockSessions);
  });

  it('should handle fetchSessionsFailure', () => {
    const state = reducer(
      { ...initialState, loading: true },
      fetchSessionsFailure('Network Error')
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network Error');
  });
});
