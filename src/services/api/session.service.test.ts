import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from './session.service';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReport mapping logic', () => {
    it('TEST 1 & 6: Existing candidate report with 4 questions and later addition of Q5', async () => {
      // Scenario: Assessment originally had 4 questions (q1-q4). Candidate completed all 4.
      // Recruiter adds Q5 worth 25 pts.
      const mockSessionData = {
        assessment: {
          questions: [
            { question: { id: 'q1', type: 'mcq' }, points: 25 },
            { question: { id: 'q2', type: 'mcq' }, points: 25 },
            { question: { id: 'q3', type: 'mcq' }, points: 25 },
            { question: { id: 'q4', type: 'mcq' }, points: 25 },
            { question: { id: 'q5', type: 'mcq' }, points: 25 }, // Added after completion
          ],
        },
        attempts: [
          { questionId: 'q1', answer: 'a' },
          { questionId: 'q2', answer: 'b' },
          { questionId: 'q3', answer: 'c' },
          { questionId: 'q4', answer: 'd' },
        ],
        result: {
          totalScore: 100,
          maxScore: 100,
          percentage: 100,
          isPassed: true,
          questionResults: [
            { questionId: 'q1', score: 25, maxScore: 25, isCorrect: true },
            { questionId: 'q2', score: 25, maxScore: 25, isCorrect: true },
            { questionId: 'q3', score: 25, maxScore: 25, isCorrect: true },
            { questionId: 'q4', score: 25, maxScore: 25, isCorrect: true },
          ],
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: { data: mockSessionData } });

      const response = await sessionService.getReport('session_1');
      const { data } = response;

      // Result should be mapped properly
      expect(data.result?.totalScore).toBe(100);
      expect(data.result?.maxScore).toBe(100);
      expect(data.result?.percentage).toBe(100);
      expect(data.result?.isPassed).toBe(true);

      // Q5 should be filtered out
      expect(data.questions.length).toBe(4);
      expect(data.questions.find((q: any) => q.id === 'q5')).toBeUndefined();
    });

    it('TEST 2 & 3: Candidate completed 3 of 4 questions (legitimate unattempted) + Q5 added later', async () => {
      // Scenario: Originally 4 questions, candidate skipped q4. Q5 added later.
      const mockSessionData = {
        assessment: {
          questions: [
            { question: { id: 'q1', type: 'mcq' }, points: 25 },
            { question: { id: 'q2', type: 'mcq' }, points: 25 },
            { question: { id: 'q3', type: 'mcq' }, points: 25 },
            { question: { id: 'q4', type: 'mcq' }, points: 25 },
            { question: { id: 'q5', type: 'mcq' }, points: 25 }, // Added after
          ],
        },
        attempts: [
          { questionId: 'q1', answer: 'a' },
          { questionId: 'q2', answer: 'b' },
          { questionId: 'q3', answer: 'c' },
        ],
        result: {
          totalScore: 75,
          maxScore: 100,
          percentage: 75,
          isPassed: true,
          questionResults: [
            { questionId: 'q1', score: 25, maxScore: 25, isCorrect: true },
            { questionId: 'q2', score: 25, maxScore: 25, isCorrect: true },
            { questionId: 'q3', score: 25, maxScore: 25, isCorrect: true },
            { questionId: 'q4', score: 0, maxScore: 25, isCorrect: false }, // Legitimate unattempted graded by backend
          ],
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: { data: mockSessionData } });

      const response = await sessionService.getReport('session_2');
      const { data } = response;

      // Result historical denominator remains 100
      expect(data.result?.maxScore).toBe(100);
      expect(data.result?.totalScore).toBe(75);

      // Questions mapped should be 4 (including q4 but excluding q5)
      expect(data.questions.length).toBe(4);
      const q4 = data.questions.find((q: any) => q.id === 'q4');
      expect(q4.attempted).toBe(false);
      expect(q4.maxScore).toBe(25);
    });

    it('TEST 4: Recruiter changes current assessment question points after completion', async () => {
      // Scenario: Originally Q1 was 25 points. Later changed to 50 points in assessment.
      const mockSessionData = {
        assessment: {
          questions: [
            { question: { id: 'q1', type: 'mcq' }, points: 50 }, // points changed
          ],
        },
        attempts: [
          { questionId: 'q1', answer: 'a' },
        ],
        result: {
          totalScore: 25,
          maxScore: 25,
          percentage: 100,
          isPassed: true,
          questionResults: [
            { questionId: 'q1', score: 25, maxScore: 25, isCorrect: true }, // Historical
          ],
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: { data: mockSessionData } });

      const response = await sessionService.getReport('session_3');
      const { data } = response;

      // Historical Result must not change
      expect(data.result?.maxScore).toBe(25);
      expect(data.result?.totalScore).toBe(25);

      // The individual question maxScore should fallback to historical
      const q1 = data.questions.find((q: any) => q.id === 'q1');
      expect(q1.maxScore).toBe(25);
    });

    it('TEST 5: Recruiter changes current assessment pass percentage after completion', async () => {
      // This is implicit since we pull from result.isPassed directly, not recalculating
      const mockSessionData = {
        assessment: { questions: [] },
        attempts: [],
        result: {
          totalScore: 50,
          maxScore: 100,
          percentage: 50,
          isPassed: true, // Passed at the time
          questionResults: [],
        },
      };

      (apiClient.get as any).mockResolvedValue({ data: { data: mockSessionData } });
      const response = await sessionService.getReport('session_4');
      
      expect(response.data.result?.isPassed).toBe(true);
    });

    it('TEST 7: Candidate currently IN_PROGRESS must not be affected by this frontend historical-report change', async () => {
      // IN_PROGRESS means no result object yet
      const mockSessionData = {
        assessment: {
          questions: [
            { question: { id: 'q1', type: 'mcq' }, points: 25 },
            { question: { id: 'q2', type: 'mcq' }, points: 25 },
          ],
        },
        attempts: [
          { questionId: 'q1', answer: 'a' },
        ],
        result: null, // No result
      };

      (apiClient.get as any).mockResolvedValue({ data: { data: mockSessionData } });
      const response = await sessionService.getReport('session_5');
      const { data } = response;

      expect(data.result).toBeUndefined();
      
      // Should include all questions (q1 and q2)
      expect(data.questions.length).toBe(2);
      const q2 = data.questions.find((q: any) => q.id === 'q2');
      expect(q2.attempted).toBe(false);
      expect(q2.maxScore).toBe(25); // Fallback to assessment points
    });
  });
});
