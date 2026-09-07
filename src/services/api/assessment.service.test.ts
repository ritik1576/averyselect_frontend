import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assessmentService } from './assessment.service';
import { apiClient } from './client';

// Mock the apiClient
vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('assessment.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /assessments', async () => {
    const mockData = { success: true, data: [] };
    (apiClient.get as any).mockResolvedValue({ data: mockData });

    const result = await assessmentService.getAll();
    
    expect(apiClient.get).toHaveBeenCalledWith('/assessments');
    expect(result).toEqual(mockData);
  });

  it('getById calls GET /assessments/:id', async () => {
    const mockData = { success: true, data: { id: '1' } };
    (apiClient.get as any).mockResolvedValue({ data: mockData });

    const result = await assessmentService.getById('1');
    
    expect(apiClient.get).toHaveBeenCalledWith('/assessments/1');
    expect(result).toEqual(mockData);
  });

  it('create calls POST /assessments', async () => {
    const payload = { title: 'New Test', durationMinutes: 60 };
    const mockData = { success: true, data: { id: 'new-id' } };
    (apiClient.post as any).mockResolvedValue({ data: mockData });

    const result = await assessmentService.create(payload);
    
    expect(apiClient.post).toHaveBeenCalledWith('/assessments', payload);
    expect(result).toEqual(mockData);
  });

  it('updateQuestions calls PUT /assessments/:id', async () => {
    (apiClient.put as any).mockResolvedValue({ data: { id: '1' } });
    
    const result = await assessmentService.updateQuestions('1', ['q1', 'q2']);
    
    expect(apiClient.put).toHaveBeenCalledWith('/assessments/1', { 
      questions: [
        { questionId: 'q1', orderIdx: 0, points: 10 },
        { questionId: 'q2', orderIdx: 1, points: 10 }
      ]
    });
    expect(result).toEqual({ data: { id: '1' } });
  });
});
