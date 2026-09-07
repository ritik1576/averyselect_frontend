import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CandidateTestRunner } from './CandidateTestRunner';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from '../../store/slices/sessionSlice';

// Mock Monaco Editor because it doesn't run well in JSDOM
vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="mock-monaco-editor">Editor</div>,
}));

// Mock matchMedia for responsive layout checks (often used by editors or dnd-kit)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const store = configureStore({
  reducer: {
    session: sessionReducer,
  },
});

describe('CandidateTestRunner Component', () => {
  it('renders the test interface correctly', () => {
    // Basic smoke test to ensure no crashes
    render(
      <Provider store={store}>
        <BrowserRouter>
          <CandidateTestRunner />
        </BrowserRouter>
      </Provider>
    );

    // It should render the first Mock Question's domain/title
    expect(screen.getByText(/Frontend Developer Assessment/i)).toBeInTheDocument();
    
    // Check if the timer/header renders
    expect(screen.getAllByText(/Question/i).length).toBeGreaterThan(0);
  });
});
