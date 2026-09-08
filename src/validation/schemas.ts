import { z } from 'zod';

// ─── Create Assessment (Test) Schema ────────────────────────────────────────
export const createAssessmentSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title is too long'),
  description: z.string().optional(),
  duration_minutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours'),
  language: z.enum(['English', 'French', 'Spanish']),
  pass_percentage: z
    .number()
    .int()
    .min(0, 'Must be 0 or above')
    .max(100, 'Must be 100 or below')
    .optional(),
});

export type CreateAssessmentFormValues = z.infer<typeof createAssessmentSchema>;

// ─── Multiple Choice Question Schema ────────────────────────────────────────
export const mcqOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Option text cannot be empty'),
  is_correct: z.boolean(),
});

export const createMCQSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  difficulty: z
    .number()
    .int()
    .min(1)
    .max(5),
  estimated_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format'),
  points: z
    .number()
    .int()
    .min(1, 'Points must be at least 1'),
  options: z
    .array(mcqOptionSchema)
    .min(2, 'At least 2 options are required')
    .refine((opts) => opts.some((o) => o.is_correct), {
      message: 'At least one option must be marked as correct',
    }),
});

export type MCQFormValues = z.infer<typeof createMCQSchema>;

// ─── Free Text Question Schema ───────────────────────────────────────────────
export const createFreeTextSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Provide a detailed prompt (at least 10 characters)'),
  difficulty: z.number().int().min(1).max(5),
  estimated_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format'),
  points: z.number().int().min(1),
  model_answer: z.string().optional(),
});

export type FreeTextFormValues = z.infer<typeof createFreeTextSchema>;

// ─── Test Case Schema ────────────────────────────────────────────────────────
export const testCaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  input: z.string().min(1, 'Input is required'),
  expected_output: z.string().min(1, 'Expected output is required'),
  is_hidden: z.boolean(),
});

// ─── Coding Question Schema ──────────────────────────────────────────────────
export const createCodingSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Provide a detailed problem description'),
  difficulty: z.number().int().min(1).max(5),
  estimated_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format'),
  points: z.number().int().min(1),
  language: z.enum(['javascript', 'python', 'typescript', 'java', 'cpp']),
  starter_code: z.string().optional(),
  test_cases: z
    .array(testCaseSchema)
    .min(1, 'At least 1 test case is required'),
});

export type CodingFormValues = z.infer<typeof createCodingSchema>;
