// ─────────────────────────────────────────────────────────────
// Finalized MVP TypeScript interfaces — aligned to DB schema
// All field names match the PostgreSQL column names exactly
// ─────────────────────────────────────────────────────────────

// ─── Core Enums ───────────────────────────────────────────────

export type QuestionType = 'mcq' | 'coding' | 'free_text';
export type QuestionStatus = 'draft' | 'published';
export type AssessmentStatus = 'draft' | 'published' | 'archived';
export type SessionStatus = 'not_started' | 'in_progress' | 'completed' | 'expired' | 'abandoned';
export type AttemptStatus = 'not_started' | 'in_progress' | 'submitted' | 'evaluated';
export type ResultStatus = 'pending' | 'passed' | 'failed' | 'reviewed';
export type AssessmentLanguage = 'English' | 'French' | 'Spanish';

// ─── Companies ────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// ─── Users ────────────────────────────────────────────────────

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// ─── Domains ──────────────────────────────────────────────────

export interface Domain {
  id: string;
  domain_name: string;
  created_at: string;
  updated_at: string;
}

// ─── Programming Languages ────────────────────────────────────

export interface ProgrammingLanguage {
  id: string;
  language_name: string;
  created_at: string;
  updated_at: string;
}

// ─── Questions ────────────────────────────────────────────────

export interface Question {
  id: string;
  company_id: string;
  title: string;
  description: string;
  question_type: QuestionType;
  difficulty: number;              // 1–5 (star rating)
  estimated_time_seconds: number;  // e.g. 1200 = 20 minutes
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
  _count?: {
    assessments: number;
  };
}

export interface QuestionOption {
  id: string;
  question_id: string;
  text: string;
  display_order: number;
  is_correct: boolean;
}

export interface TestCase {
  id: string;
  question_id: string;
  title: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionDomain {
  id: string;
  question_id: string;
  domain_id: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionLanguage {
  id: string;
  question_id: string;
  programming_language_id: string;
  starter_code: string;
  created_at: string;
  updated_at: string;
}

// ─── Assessments (Tests) ──────────────────────────────────────

export interface Assessment {
  id: string;
  company_id: string;
  title: string;
  description: string;
  duration_minutes: number;       // in minutes
  language: AssessmentLanguage;
  status: AssessmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_id: string;
  display_order: number;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentLink {
  id: string;
  assessment_id: string;
  token: string;
  status: 'active' | 'disabled' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// ─── Assessment Security Settings ─────────────────────────────
// MVP scope: 6 settings only. Others removed.

export interface AssessmentSecuritySettings {
  id: string;
  assessmentId: string;
  fullscreenRequired: boolean;
  tabSwitchDetection: boolean;
  windowFocusDetection: boolean;
  copyPasteBlocking: boolean;
  largePasteDetection: boolean;
  unusualActivityAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Candidates ───────────────────────────────────────────────

export interface Candidate {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Sessions ─────────────────────────────────────────────────

export interface Session {
  id: string;
  company_id: string;
  candidate_id: string;
  assessment_id: string;
  status: SessionStatus;
  started_at: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Question Attempts ────────────────────────────────────────

export interface QuestionAttempt {
  id: string;
  session_id: string;
  question_id: string;
  answer: string | null;         // JSON string for MCQ, plain text for free_text
  status: AttemptStatus;
  started_at: string | null;
  completed_at?: string | null;
  submitted_at: string | null;
  last_saved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Executions (Code Runs) ───────────────────────────────────

export interface Execution {
  id: string;
  question_attempt_id: string;
  code: string;
  programming_language_id: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'timeout';
  input: string | null;
  output: string | null;
  error: string | null;
  execution_time_ms: number | null;  // milliseconds
  created_at: string;
}

// ─── Results ──────────────────────────────────────────────────

export interface Result {
  id: string;
  session_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  status: ResultStatus;
  created_at: string;
  updated_at: string;
}

export interface QuestionResult {
  id: string;
  result_id: string;
  question_id: string;
  score: number;
  max_score: number;
  percentage: number;
  status: ResultStatus;
  created_at: string;
  updated_at: string;
}

export interface ResultDomain {
  id: string;
  result_id: string;
  domain_id: string;
  score: number;
  max_score: number;
  percentage: number;
  created_at: string;
  updated_at: string;
}

// ─── Activity Events ──────────────────────────────────────────

export interface ActivityEvent {
  id: string;
  sessionId: string;
  eventType: string;
  details: any | null;
  createdAt: string;
}

export interface SessionReport {
  questions: any[];
  activityEvents: ActivityEvent[];
  assessment_title?: string;
  candidate_name?: string;
  candidate_email?: string;
  started_at?: string;
  completed_at?: string;
}

// ─── UI-layer composite types (not stored in DB) ──────────────

/** Used by QuestionLibrary list — joins questions + domains + languages */
export interface QuestionListItem extends Question {
  domains: Domain[];
}

/** Used by Tests Dashboard — assessment + computed candidate count */
export interface AssessmentListItem extends Assessment {
  candidate_count: number;
  domain_tags: string[];          // e.g. ['JS', 'Git', '+5']
}

/** Used by Candidate List — session + candidate info joined */
export interface CandidateSessionListItem {
  session_id: string;
  assessment_id: string;
  assessment_title: string;
  assessment_created_at: string;
  started_at: string | null;
  completed_at?: string | null;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  total_score: number;
  max_score: number;
  percentage: number;
  status: SessionStatus;
  isPassed?: boolean | null;
  passingPercentage?: number;
}
