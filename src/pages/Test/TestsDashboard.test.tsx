import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestsDashboard } from './TestsDashboard';
import { BrowserRouter } from 'react-router-dom';

vi.mock('react-redux', () => ({
  useSelector: vi.fn((selector) => selector({
    assessment: {
      tests: [
        {
          id: 'mock-1',
          title: 'Mock Frontend Test',
          description: '',
          duration_minutes: 60,
          language: 'English',
          status: 'published',
          company_id: 'c1',
          created_at: '',
          updated_at: '',
          candidate_count: 42,
          domain_tags: ['React'],
        },
      ],
      loading: false,
      error: null,
    },
  })),
  useDispatch: () => vi.fn(),
}));

// Mock Recharts to avoid ResizeObserver and complex SVG rendering issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div>LineChart</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

describe('TestsDashboard Component', () => {
  it('renders tests from mocked Redux state', () => {
    render(
      <BrowserRouter>
        <TestsDashboard />
      </BrowserRouter>
    );

    // The test title should be in the document
    expect(screen.getByText('Mock Frontend Test')).toBeInTheDocument();
    
    // The candidate count should be in the document
    expect(screen.getByText(/42 candidates/i)).toBeInTheDocument();
  });
});
