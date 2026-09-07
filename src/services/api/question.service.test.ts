import { describe, it, expect, vi, beforeEach } from 'vitest';
import { questionService } from './question.service';
import { apiClient } from './client';

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('question.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /questions', async () => {
    const mockData = { success: true, data: [] };
    (apiClient.get as any).mockResolvedValue({ data: mockData });

    const result = await questionService.getAll();
    
    expect(apiClient.get).toHaveBeenCalledWith('/questions');
    expect(result).toEqual(mockData);
  });

  it('create calls POST /questions', async () => {
    const payload = { title: 'New Question', question_type: 'mcq' };
    const mockData = { success: true, data: { id: 'new-id' } };
    (apiClient.post as any).mockResolvedValue({ data: mockData });

    const result = await questionService.create(payload as any);
    
    expect(apiClient.post).toHaveBeenCalledWith('/questions', payload);
    expect(result).toEqual(mockData);
  });
});
