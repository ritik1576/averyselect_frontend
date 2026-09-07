import { apiClient } from './client';
import type { ApiResponse } from '../../types/api';
import type { CandidateSessionListItem } from '../../types';

export interface SessionListParams {
  assessmentId?: string;
  reviewStatus?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'startedAt' | 'candidateName' | 'assessmentTitle' | 'score';
  sortDir?: 'asc' | 'desc';
}

export interface SessionListResponse {
  data: CandidateSessionListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const sessionService = {
  // Global candidate list — all filtering/sorting/pagination done server-side
  getAll: async (params: SessionListParams = {}): Promise<SessionListResponse> => {
    const qs = new URLSearchParams();
    qs.set('page',  String(params.page  ?? 1));
    qs.set('limit', String(params.limit ?? 10));
    if (params.search)   qs.set('search',   params.search);
    if (params.status)   qs.set('status',   params.status);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo)   qs.set('dateTo',   params.dateTo);
    if (params.sortBy)   qs.set('sortBy',   params.sortBy);
    if (params.sortDir)  qs.set('sortDir',  params.sortDir);
    if (params.assessmentId) qs.set('assessmentId', params.assessmentId);
    if (params.reviewStatus) qs.set('reviewStatus', params.reviewStatus);

    const response = await apiClient.get(`/sessions?${qs.toString()}`);
    const mappedData = response.data.data.map((item: any): CandidateSessionListItem => ({
      session_id:             item.sessionId,
      assessment_id:          item.assessmentId,
      assessment_title:       item.assessmentTitle,
      assessment_created_at:  item.assessmentCreatedAt,
      started_at:             item.startedAt,
      completed_at:           item.completedAt,
      candidate_id:           item.candidateId,
      candidate_name:         item.candidateName,
      candidate_email:        item.candidateEmail,
      total_score:            item.totalScore,
      max_score:              item.maxScore,
      // Backend now returns correctly calculated percentage; keep as-is
      percentage:             item.percentage,
      status:                 item.status,
      isPassed:               item.isPassed,
    }));
    return {
      data: mappedData,
      meta: response.data.meta ?? { total: mappedData.length, page: 1, limit: 10, totalPages: 1 }
    };
  },

  // Detailed report for a specific session
  getReport: async (sessionId: string): Promise<ApiResponse<import('../../types').SessionReport>> => {
    const response = await apiClient.get(`/sessions/${sessionId}/report`);
    const sessionData = response.data.data;
    
    // Helper to format ms to MM:SS
    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    // Map the backend session data into the QuestionResult array format expected by the UI
    const allQuestions = sessionData?.assessment?.questions || [];
    const mappedQuestions = allQuestions.map((aq: any, index: number) => {
      const q = aq.question || {};
      const attempt = sessionData?.attempts?.find((a: any) => a.questionId === q.id) || {};
      const isCoding = q.type === 'CODING' || q.type === 'coding';
      const qResult = sessionData?.result?.questionResults?.find((qr: any) => qr.questionId === q.id);
      
      const score = qResult?.score || 0;
      // IMPORTANT: Always use Question.points as authoritative maxScore.
      // QuestionResult.maxScore was set by auto-grader which uses hardcoded 10 — NOT the real question points.
      const maxScore = q.points || qResult?.maxScore || 0;
      const isCorrect = qResult?.isCorrect ?? (score > 0 && score >= maxScore);
      const timeTakenStr = attempt.timeSpentMs ? formatTime(attempt.timeSpentMs) : '00:00';

      // Build the UI answer structure
      let answerData: any;
      
      if (isCoding) {
        // Construct keystrokes from activity events if available
        const codeEvents = sessionData?.activityEvents
          ?.filter((e: any) => e.eventType === 'CODE_CHANGED' && e.details?.questionId === q.id)
          ?.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        const keystrokes = codeEvents?.map((e: any) => ({
          code: e.details?.code,
          timestamp: new Date(e.createdAt).getTime()
        })) || [];
        if (keystrokes.length === 0 && attempt.answer) {
          keystrokes.push({ code: attempt.answer, timestamp: Date.now() });
        }

        let calculatedTimeStr = timeTakenStr;
        if (keystrokes.length > 1) {
          const start = keystrokes[0].timestamp;
          const end = keystrokes[keystrokes.length - 1].timestamp;
          const diffSecs = Math.max(0, Math.floor((end - start) / 1000));
          calculatedTimeStr = formatTime(diffSecs * 1000);
        }

        answerData = {
          type: 'coding',
          timeTaken: calculatedTimeStr,
          totalTime: '00:00', // Still not provided by backend per question limit
          finalCode: attempt.answer || '',
          keystrokes: keystrokes,
          correctAnswer: undefined // Still not provided by backend
        };
      } else {
        // Assume MCQ if not coding
        const optionsList = Array.isArray(q.options) && q.options.length > 0 
          ? q.options.map((opt: any) => ({
              text: opt.text || opt, // Handle both string and object options
              selected: (attempt.answer === opt.id || attempt.answer === opt.text || attempt.answer === opt),
              isCorrect: opt.isCorrect // if backend provides it, otherwise UI might miss highlighting correct answer if candidate got it wrong
            }))
          : [
              { text: attempt.answer || 'No answer', selected: true, isCorrect: isCorrect }
            ];

        answerData = {
          type: 'mcq',
          timeTaken: timeTakenStr,
          totalTime: '00:00',
          options: optionsList
        };
      }

      const isAttempted = !!attempt.id || !!attempt.answer;
      
      return {
        id: q.id || index, // Use index as fallback id for UI rendering
        domain: q.type || 'General',
        title: q.title || 'Question',
        body: q.text || '',
        codeSnippet: null,
        score: score,
        maxScore: maxScore,
        correct: isCorrect,
        partial: score > 0 && score < maxScore,
        attempted: isAttempted,
        resultLabel: !isAttempted ? 'Not Attempted' : (isCorrect ? 'Correct solution' : 'Incorrect solution'),
        resultTag: '',
        answer: answerData,
      };
    });

    return { 
      data: {
        questions: mappedQuestions,
        activityEvents: sessionData?.activityEvents || [],
        assessment_title: sessionData?.assessment?.title,
        candidate_name: sessionData?.candidate?.name,
        candidate_email: sessionData?.candidate?.email,
        started_at: sessionData?.startedAt,
        completed_at: sessionData?.completedAt,
      }, 
      success: true 
    };
  },

  // Manual score override
  updateScore: async (sessionId: string, questionId: string, score: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/sessions/${sessionId}/score`, { questionId, score });
    return { data: response.data.data, success: true };
  },

  // Manual review status update
  updateReviewStatus: async (sessionId: string, isPassed: boolean | null): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/sessions/${sessionId}/review`, { isPassed });
    return { data: response.data.data, success: true };
  }
};
