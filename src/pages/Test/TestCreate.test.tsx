import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestCreate } from './TestCreate';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../store';

// Mock the API service so we don't make real network calls
vi.mock('../../services/api/assessment.service', () => ({
  assessmentService: {
    create: vi.fn(),
  },
}));

describe('TestCreate Component', () => {
  it('renders the form with essential fields', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <TestCreate />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByPlaceholderText(/Frontend Developer Assessment/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe what this test assesses/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create test/i })).toBeInTheDocument();
  });

  it('shows validation errors if submitted empty', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <TestCreate />
        </BrowserRouter>
      </Provider>
    );

    const submitBtn = screen.getByRole('button', { name: /create test & add questions/i });
    fireEvent.click(submitBtn);

    // zod validation errors should appear
    const titleError = await screen.findByText(/title must be at least 3 characters/i);
    expect(titleError).toBeInTheDocument();
  });
});
