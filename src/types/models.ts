export type QuestionType = 'TEXT' | 'MCQ' | 'CODING';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface TestCase {
  id?: string;
  title?: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface Option {
  id?: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  title: string;
  question_type: 'free_text' | 'mcq' | 'coding';
  description?: string;
  points?: number;
  difficulty?: DifficultyLevel;
  estimated_time_seconds?: number;
  options?: Option[];
  test_cases?: TestCase[];
  model_answer?: string;
  language?: string;
  starter_code?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  durationSeconds?: number;
  passingScore?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  score?: number;
  assessmentId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  data: AuthUser;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
}
