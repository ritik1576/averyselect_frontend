import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import sessionReducer from '../../store/slices/sessionSlice';
import { CandidateDetailReport } from './CandidateDetailReport';

// Mock lucide-react to avoid SVG rendering issues in tests
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  User: () => <div data-testid="icon-user" />,
  Mail: () => <div data-testid="icon-mail" />,
  XCircle: () => <div data-testid="icon-x-circle" />,
  CheckCircle2: () => <div data-testid="icon-check-circle2" />,
  Copy: () => <div data-testid="icon-copy" />,
  Play: () => <div data-testid="icon-play" />,
  Pause: () => <div data-testid="icon-pause" />,
  Maximize2: () => <div data-testid="icon-maximize2" />,
  Minimize2: () => <div data-testid="icon-minimize2" />,
  RotateCcw: () => <div data-testid="icon-rotate-ccw" />,
  AlertTriangle: () => <div data-testid="icon-alert-triangle" />,
  Edit2: () => <div data-testid="icon-edit2" />,
  Check: () => <div data-testid="icon-check" />,
  XIcon: () => <div data-testid="icon-x-icon" />,
  ShieldAlert: () => <div data-testid="icon-shield-alert" />,
  MonitorOff: () => <div data-testid="icon-monitor-off" />,
  CopyX: () => <div data-testid="icon-copy-x" />,
  ChevronDown: () => <div data-testid="icon-chevron-down" />,
  Camera: () => <div data-testid="icon-camera" />,
  VideoOff: () => <div data-testid="icon-video-off" />,
  Users: () => <div data-testid="icon-users" />,
  Clock: () => <div data-testid="icon-clock" />,
  Activity: () => <div data-testid="icon-activity" />,
}));

// Setup Redux store helper
const renderWithStore = (preloadedState = {}) => {
  const store = configureStore({
    reducer: { session: sessionReducer },
    preloadedState,
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <CandidateDetailReport />
      </MemoryRouter>
    </Provider>
  );
};

const mockActivityEvents = [
  { id: '1', sessionId: 's1', eventType: 'ASSESSMENT_STARTED', createdAt: '2026-09-23T10:00:00.000Z' },
  { id: '2', sessionId: 's1', eventType: 'CAMERA_STARTED', createdAt: '2026-09-23T10:00:05.000Z' },
  { id: '3', sessionId: 's1', eventType: 'FACE_NOT_DETECTED', createdAt: '2026-09-23T10:05:00.000Z' },
  { id: '4', sessionId: 's1', eventType: 'TAB_SWITCHED', createdAt: '2026-09-23T10:06:00.000Z' },
  { id: '5', sessionId: 's1', eventType: 'MULTIPLE_FACES_DETECTED', createdAt: '2026-09-23T10:10:00.000Z' },
  { id: '6', sessionId: 's1', eventType: 'UNKNOWN_EVENT_TYPE', createdAt: '2026-09-23T10:15:00.000Z' },
];

const defaultState = {
  session: {
    sessions: [
      {
        session_id: 's1',
        assessment_id: 'a1',
        candidate_name: 'John Doe',
        isPassed: false,
        total_score: 50,
        max_score: 100,
        percentage: 50,
        status: 'COMPLETED',
      },
    ],
    sessionReport: {
      activityEvents: mockActivityEvents,
      questions: [],
      result: { totalScore: 50, maxScore: 100, percentage: 50, isPassed: false },
    },
    loading: false,
    error: null,
  },
};

describe('CandidateDetailReport - Phase 3 Timeline', () => {
  it('renders the Activity & Integrity timeline safely when activityEvents is empty', () => {
    const emptyState = {
      session: {
        sessions: [],
        sessionReport: { activityEvents: [], questions: [], result: null },
      },
    };
    renderWithStore(emptyState);
    expect(screen.getByText('Activity & Integrity Timeline')).toBeInTheDocument();
    expect(screen.getByText('No activity events recorded for this session.')).toBeInTheDocument();
  });

  it('renders the Activity & Integrity timeline safely when activityEvents is undefined', () => {
    const undefinedState = {
      session: {
        sessions: [],
        sessionReport: { questions: [], result: null }, // activityEvents omitted
      },
    };
    renderWithStore(undefinedState);
    expect(screen.getByText('Activity & Integrity Timeline')).toBeInTheDocument();
    expect(screen.getByText('No activity events recorded for this session.')).toBeInTheDocument();
  });

  it('renders existing activity events alongside webcam events chronologically', () => {
    renderWithStore(defaultState);
    expect(screen.getByText('Activity & Integrity Timeline')).toBeInTheDocument();
    
    const timelineItems = screen.getAllByTestId('timeline-item-label');
    expect(timelineItems).toHaveLength(6);

    // Verify chronological order mapping is strictly what is provided in state
    expect(timelineItems[0]).toHaveTextContent('Assessment started');
    expect(timelineItems[1]).toHaveTextContent('Camera started.');
    expect(timelineItems[2]).toHaveTextContent('Candidate face was not detected.');
    expect(timelineItems[3]).toHaveTextContent('Tab Switched');
    expect(timelineItems[4]).toHaveTextContent('Multiple faces were detected.');
    expect(timelineItems[5]).toHaveTextContent('UNKNOWN_EVENT_TYPE'); // Safe fallback
  });

  it('maps all 7 webcam event types to neutral descriptions without cheating/fraud labels', () => {
    const webcamEvents = [
      { id: '1', eventType: 'CAMERA_STARTED', createdAt: '2026-09-23T10:00:00Z' },
      { id: '2', eventType: 'CAMERA_PERMISSION_DENIED', createdAt: '2026-09-23T10:01:00Z' },
      { id: '3', eventType: 'CAMERA_ERROR', createdAt: '2026-09-23T10:02:00Z' },
      { id: '4', eventType: 'CAMERA_DISCONNECTED', createdAt: '2026-09-23T10:03:00Z' },
      { id: '5', eventType: 'FACE_NOT_DETECTED', createdAt: '2026-09-23T10:04:00Z' },
      { id: '6', eventType: 'FACE_DETECTED', createdAt: '2026-09-23T10:05:00Z' },
      { id: '7', eventType: 'MULTIPLE_FACES_DETECTED', createdAt: '2026-09-23T10:06:00Z' },
    ];
    
    renderWithStore({
      session: {
        sessions: [],
        sessionReport: { activityEvents: webcamEvents, questions: [], result: null },
      },
    });

    const labels = screen.getAllByTestId('timeline-item-label').map(el => el.textContent);
    
    expect(labels).toEqual([
      'Camera started.',
      'Camera permission was denied.',
      'Camera error occurred.',
      'Camera connection was interrupted.',
      'Candidate face was not detected.',
      'Candidate face was detected.',
      'Multiple faces were detected.',
    ]);

    // Ensure no negative/judgmental words exist in the mapped labels
    const allText = labels.join(' ').toLowerCase();
    expect(allText).not.toContain('cheat');
    expect(allText).not.toContain('fraud');
    expect(allText).not.toContain('suspicious');
  });

  it('preserves the existing Security Flags component unchanged', () => {
    renderWithStore(defaultState);
    expect(screen.getByText('Security Flags (1 total events)')).toBeInTheDocument();
    
    // TAB_SWITCHED is grouped in the Security Flags
    const securityLabelRows = screen.getAllByText('Tab Switched');
    expect(securityLabelRows.length).toBeGreaterThan(0);
  });
  
  it('does not affect candidate score rendering', () => {
    renderWithStore(defaultState);
    const scoreVal = screen.getByText('50'); // totalScore
    expect(scoreVal).toBeInTheDocument();
    const maxVal = screen.getByText('/ 100 pts'); // maxScore
    expect(maxVal).toBeInTheDocument();
  });
});
