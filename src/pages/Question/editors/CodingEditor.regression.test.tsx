import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CodingEditor } from './CodingEditor';

const mockDispatch = vi.fn();
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => selector({
      question: { loading: false, error: null, currentQuestion: null },
      auth: { user: { role: 'admin' } }
    }),
  };
});

vi.mock('@uiw/react-codemirror', () => ({
  default: () => <div data-testid="code-mirror-mock" />
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: undefined })
  };
});

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() }
}));

describe('CodingEditor Regression', () => {
  it('clears functionContract and sends explicitly null when switching from FUNCTION to FULL_PROGRAM', async () => {
    render(
      <MemoryRouter>
        <CodingEditor />
      </MemoryRouter>
    );

    // Initial load is FULL_PROGRAM. Fill in basic required fields to pass validation
    const titleInput = screen.getByPlaceholderText('Exercise Title...');
    fireEvent.change(titleInput, { target: { value: 'Test Question' } });
    
    const descInput = screen.getByPlaceholderText(/Describe the problem/i);
    fireEvent.change(descInput, { target: { value: 'Description' } });
    
    // Fill in required test case fields
    const testInput = screen.getByPlaceholderText('e.g. [1, 2, 3]');
    fireEvent.change(testInput, { target: { value: '1 2' } });
    const expectedOutput = screen.getByPlaceholderText('e.g. 6');
    fireEvent.change(expectedOutput, { target: { value: '3' } });
    
    // Switch to FUNCTION mode
    const functionModeRadio = screen.getByDisplayValue('FUNCTION');
    fireEvent.click(functionModeRadio);

    // Set some function contract fields
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. twoSum')).toBeDefined();
    });
    
    const functionNameInput = screen.getByPlaceholderText('e.g. twoSum');
    fireEvent.change(functionNameInput, { target: { value: 'add' } });

    // Switch back to FULL_PROGRAM
    const fullProgramRadio = screen.getByDisplayValue('FULL_PROGRAM');
    fireEvent.click(fullProgramRadio);

    // Wait for the function contract builder to disappear
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('e.g. twoSum')).toBeNull();
    });

    // Save the question
    const saveButton = screen.getByRole('button', { name: /Save Question/i });
    fireEvent.click(saveButton);

    // Verify the action dispatched
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    // Find the createQuestionRequest call
    const createCall = mockDispatch.mock.calls.find(call => 
      call[0] && call[0].type === 'question/createQuestionRequest'
    );
    
    expect(createCall).toBeDefined();
    const payload = createCall[0].payload.data;
    
    expect(payload.executionMode).toBe('FULL_PROGRAM');
    expect(payload.functionContract).toBeNull();
  });
});
