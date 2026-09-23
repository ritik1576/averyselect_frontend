import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

    // It should render the loading state because we haven't mocked the redux session fetch
    expect(screen.getByText(/Loading Test Environment/i)).toBeDefined();
  });

  describe('Webcam Integrity Integration', () => {
    let logEventMock: any;

    beforeEach(async () => {
      const candidateService = await import('../../services/api/candidate.service');
      logEventMock = vi.spyOn(candidateService.candidateService, 'logEvent').mockResolvedValue({ success: true, data: undefined });
      
      const webcamHook = await import('../../hooks/useWebcamProctoring');
      vi.spyOn(webcamHook, 'useWebcamProctoring').mockImplementation((props) => {
        // Expose a global way to trigger events for testing
        if (props?.onIntegrityEvent) {
          (globalThis as any).triggerWebcamEvent = props.onIntegrityEvent;
        }
        return {
          mediaStream: null,
          videoRef: { current: null },
          cameraStatus: 'active',
          faceStatus: 'unknown'
        };
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
      delete (globalThis as any).triggerWebcamEvent;
    });

    it('should call candidateService.logEvent when an integrity event is emitted', async () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <CandidateTestRunner />
          </BrowserRouter>
        </Provider>
      );

      // Trigger event
      await (globalThis as any).triggerWebcamEvent({ eventType: 'FACE_NOT_DETECTED', metadata: { reason: 'test' } });

      expect(logEventMock).toHaveBeenCalledWith('FACE_NOT_DETECTED', { reason: 'test' });
    });

    it('should not crash if candidateService.logEvent fails (best-effort)', async () => {
      logEventMock.mockRejectedValue(new Error('Network Error'));

      render(
        <Provider store={store}>
          <BrowserRouter>
            <CandidateTestRunner />
          </BrowserRouter>
        </Provider>
      );

      await (globalThis as any).triggerWebcamEvent({ eventType: 'FACE_NOT_DETECTED', metadata: {} });

      // Component should still be mounted and not crashed
      expect(screen.getByText(/Loading Test Environment/i)).toBeDefined();
    });
  });
});
