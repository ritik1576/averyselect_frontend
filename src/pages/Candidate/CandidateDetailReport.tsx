import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import { fetchSessionReportRequest, fetchSessionsRequest } from '../../store/slices/sessionSlice';
import {
  X, User, Mail,
  XCircle, CheckCircle2, Copy,
  Play, Pause, Maximize2, Minimize2, RotateCcw,
  AlertTriangle, Edit2, Check, X as XIcon, ShieldAlert, MonitorOff, CopyX
} from 'lucide-react';
import './CandidateDetailReport.css';
import { sessionService } from '../../services/api/session.service';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MCQAnswer {
  type: 'mcq';
  options: { text: string; selected: boolean; isCorrect: boolean }[];
  timeTaken: string;
  totalTime: string;
}

interface KeystrokeEvent {
  code: string;
  timestamp: number;
}

interface CodePlaybackAnswer {
  type: 'coding';
  finalCode: string;
  keystrokes: KeystrokeEvent[];
  timeTaken: string;
  totalTime: string;
  correctAnswer?: string;
}

type QuestionAnswer = MCQAnswer | CodePlaybackAnswer;

interface QuestionResult {
  id: number;
  domain: string;
  title: string;
  body: string | null;
  codeSnippet: string | null;
  score: number;
  maxScore: number;
  correct: boolean;
  partial: boolean;
  attempted?: boolean;
  resultLabel: string;
  resultTag: string;
  answer: QuestionAnswer;
}


import type { ActivityEvent } from '../../types';

// ─── Code Playback Player Component ──────────────────────────────────────────
const SPEEDS = [0.5, 1, 1.5, 2, 4, 8];

interface CodePlaybackProps {
  answer: CodePlaybackAnswer;
  questionId: number;
}

const CodePlaybackPlayer: React.FC<CodePlaybackProps> = ({ answer, questionId }) => {
  const keystrokes = useMemo(() => {
    const ks = [...answer.keystrokes];
    if (ks.length === 0 || ks[ks.length - 1].code !== answer.finalCode) {
       ks.push({
         code: answer.finalCode || '',
         timestamp: (ks.length > 0 ? ks[ks.length - 1].timestamp : 0) + 1000
       });
    }
    return ks;
  }, [answer.keystrokes, answer.finalCode]);

  const total = keystrokes.length - 1;

  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDraggingRef = useRef(false);
  const initializedRef = useRef(false);

  // All mutable playback state lives in refs to avoid stale closures
  const timeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const speedRef = useRef(1);

  // React state only used to trigger re-renders
  const [renderTime, setRenderTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [skipPauses, setSkipPauses] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentSpeed = SPEEDS[speedIndex];

  // Keep speedRef in sync
  useEffect(() => { speedRef.current = currentSpeed; }, [currentSpeed]);

  // Precompute timeline (index -> virtual ms)
  const timeline = useMemo(() => {
    if (total <= 0) return [0];
    const tl = [0];
    let elapsed = 0;
    for (let i = 1; i <= total; i++) {
      let delay = (keystrokes[i]?.timestamp || 0) - (keystrokes[i - 1]?.timestamp || 0);
      if (delay < 0) delay = 0;
      if (skipPauses && delay > 2000) delay = 2000;
      elapsed += delay;
      tl.push(elapsed);
    }
    return tl;
  }, [keystrokes, total, skipPauses]);

  const totalPlaybackTime = timeline[total] || 0;
  const totalPlaybackTimeRef = useRef(totalPlaybackTime);
  
  useEffect(() => { 
    totalPlaybackTimeRef.current = totalPlaybackTime; 
    if (!initializedRef.current && totalPlaybackTime > 0) {
      initializedRef.current = true;
      setRenderTime(totalPlaybackTime);
      timeRef.current = totalPlaybackTime;
    }
  }, [totalPlaybackTime]);

  // Binary search: find current keystroke index from time
  const getIndexAtTime = (t: number) => {
    if (t <= 0) return 0;
    if (t >= totalPlaybackTime) return total;
    let left = 0, right = total, ans = 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (timeline[mid] <= t) { ans = mid; left = mid + 1; }
      else { right = mid - 1; }
    }
    return ans;
  };

  // Derived display values from renderTime
  const currentIndex = getIndexAtTime(renderTime);
  const currentCode = keystrokes[currentIndex]?.code ?? '';
  const progress = totalPlaybackTime === 0 ? 100 : Math.min(100, (renderTime / totalPlaybackTime) * 100);
  const elapsedSecs = renderTime / 1000;
  const totalSecs = totalPlaybackTime / 1000;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Single interval that ticks every 16ms (~60fps) when playing
  const startInterval = () => {
    if (intervalRef.current) return;
    let last = performance.now();
    intervalRef.current = setInterval(() => {
      if (!isPlayingRef.current) return;
      const now = performance.now();
      const delta = now - last;
      last = now;
      const next = Math.min(timeRef.current + delta * speedRef.current, totalPlaybackTimeRef.current);
      timeRef.current = next;
      setRenderTime(next);
      if (next >= totalPlaybackTimeRef.current) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 16);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => () => stopInterval(), []);

  const handlePlayPause = () => {
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      stopInterval();
    } else {
      if (timeRef.current >= totalPlaybackTime) {
        timeRef.current = 0;
        setRenderTime(0);
      }
      isPlayingRef.current = true;
      setIsPlaying(true);
      startInterval();
    }
  };

  const handleRestart = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopInterval();
    timeRef.current = 0;
    setRenderTime(0);
  };

  const getRatioFromX = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ratio = getRatioFromX(e.clientX, e.currentTarget);
    const newTime = ratio * totalPlaybackTime;
    timeRef.current = newTime;
    setRenderTime(newTime);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const ratio = getRatioFromX(e.clientX, e.currentTarget);
    const newTime = ratio * totalPlaybackTime;
    timeRef.current = newTime;
    setRenderTime(newTime);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleSpeedClick = () => setSpeedIndex((i) => (i + 1) % SPEEDS.length);

  const handleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    setIsFullscreen((f) => !f);
  };

  return (
    <div ref={containerRef} className={`cdr-playback-container ${isFullscreen ? 'cdr-playback--fullscreen' : ''}`}>
      {/* Code Display */}
      <div className="cdr-pb-code">
        <pre className="cdr-pb-pre">{currentCode}<span className="cdr-pb-cursor">|</span></pre>
        {currentIndex === total && (
          <div className="cdr-pb-final-badge">Final submission</div>
        )}
      </div>

      {/* Controls */}
      <div className="cdr-pb-controls">
        {/* Progress Bar */}
        <div
          className="cdr-pb-progress"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="slider"
          aria-label="Playback progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ touchAction: 'none', cursor: 'pointer' }}
        >
          <div className="cdr-pb-progress-track">
            <div className="cdr-pb-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div
            className="cdr-pb-progress-thumb"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Toolbar */}
        <div className="cdr-pb-toolbar">
          {/* Speed */}
          <button
            className="cdr-pb-speed"
            onClick={handleSpeedClick}
            title={`Playback speed: ${currentSpeed}x (click to change)`}
          >
            {currentSpeed}x
          </button>

          {/* Skip pauses toggle */}
          <div className="cdr-pb-skip">
            <button
              className={`cdr-pb-skip-toggle ${skipPauses ? 'cdr-pb-skip-toggle--on' : ''}`}
              onClick={() => setSkipPauses((s) => !s)}
              title="Skip pauses"
            >
              <div className="cdr-pb-skip-knob" />
            </button>
            <span>Skip pauses</span>
          </div>

          {/* Restart */}
          <button
            className="cdr-pb-control-btn"
            onClick={handleRestart}
            title="Restart from beginning"
          >
            <RotateCcw size={15} />
          </button>


          {/* Play / Pause */}
          <button
            id={`playback-play-${questionId}`}
            className="cdr-pb-play"
            onClick={handlePlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" />}
          </button>

          {/* Time */}
          <div className="cdr-pb-time">
            {formatTime(elapsedSecs)}/{formatTime(totalSecs)}
          </div>

          {/* Fullscreen */}
          <button
            className="cdr-pb-fullscreen"
            onClick={handleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};



// ─── MCQ Answer Display ───────────────────────────────────────────────────────
const MCQAnswerBlock: React.FC<{ answer: MCQAnswer }> = ({ answer }) => (
  <div className="cdr-radio-list">
    {answer.options.map((opt, i) => {
      const cls = opt.selected
        ? opt.isCorrect
          ? 'active-correct'
          : 'active-wrong'
        : opt.isCorrect
        ? 'correct-not-selected'
        : '';
      return (
        <label key={i} className={`cdr-radio ${cls}`}>
          <div className="cdr-radio-circle">
            {opt.selected && <div className="cdr-radio-dot" />}
          </div>
          <span className="cdr-radio-text">{opt.text}</span>
          {opt.isCorrect && !opt.selected && (
            <span className="cdr-radio-correct-hint" title="This was the correct answer">✓</span>
          )}
        </label>
      );
    })}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const CandidateDetailReport: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { sessionReport } = useAppSelector((state) => state.session);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionResult[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [editingScoreId, setEditingScoreId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchSessionReportRequest(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (sessionReport) {
      setQuestions(sessionReport.questions || []);
      setActivityEvents(sessionReport.activityEvents || []);
    }
  }, [sessionReport]);
  const [editScoreValue, setEditScoreValue] = useState<number>(0);

  const handleCopy = (code: string, id: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleEditScoreStart = (q: QuestionResult) => {
    setEditingScoreId(q.id);
    setEditScoreValue(q.score);
  };

  const handleEditScoreSave = async (questionId: number) => {
    try {
      if (!id) return;
      const question = questions.find(q => q.id === questionId);
      if (question && editScoreValue > question.maxScore) {
        alert(`Score cannot exceed the maximum points (${question.maxScore})`);
        return;
      }
      
      await sessionService.updateScore(id, questionId.toString(), editScoreValue);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, score: editScoreValue } : q));
      setEditingScoreId(null);
      // Refetch global sessions to update candidate list score silently
      dispatch(fetchSessionsRequest());
    } catch (error) {
      console.error('Failed to update score', error);
      // Revert or show error toast ideally
      setEditingScoreId(null);
    }
  };

  const handleEditScoreCancel = () => {
    setEditingScoreId(null);
  };

  const totalScore = questions.reduce((s, q) => s + q.score, 0);
  const totalMax = questions.reduce((s, q) => s + q.maxScore, 0);

  const { sessions } = useAppSelector((state) => state.session);
  const sessionData = sessions.find((s) => s.session_id === id);

  // Calculate total time taken from session start/end times
  const startedAt = sessionData?.started_at || sessionReport?.started_at;
  const completedAt = sessionData?.completed_at || sessionReport?.completed_at;

  const totalTimeSeconds = (startedAt && completedAt)
    ? Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    : questions.reduce((total, q) => {
        if (q.answer && q.answer.timeTaken) {
          const [mins, secs] = q.answer.timeTaken.split(':').map(Number);
          if (!isNaN(mins) && !isNaN(secs)) {
            return total + mins * 60 + secs;
          }
        }
        return total;
      }, 0);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: string) => {
    if (type === 'TAB_SWITCHED') return <MonitorOff size={16} color="#ef4444" />;
    if (type === 'FULLSCREEN_EXITED') return <Maximize2 size={16} color="#f97316" />;
    if (type === 'COPY_ATTEMPTED' || type === 'LARGE_PASTE_DETECTED') return <CopyX size={16} color="#ef4444" />;
    return <ShieldAlert size={16} color="#ea580c" />;
  };

  const getEventLabel = (event: ActivityEvent) => {
    if (event.eventType === 'TAB_SWITCHED') {
      if (event.details?.reason === 'mouse_leave') return 'Mouse Left Window';
      if (event.details?.reason === 'window_blur') return 'Window Lost Focus';
      return 'Tab Switched';
    }
    if (event.eventType === 'FULLSCREEN_EXITED') return 'Exited Fullscreen';
    if (event.eventType === 'COPY_ATTEMPTED') return 'Copy/Paste Attempted';
    if (event.eventType === 'LARGE_PASTE_DETECTED') return 'Large Paste Detected';
    return event.eventType;
  };

  const formatEventTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const securityViolations = activityEvents.filter(e => 
    ['TAB_SWITCHED', 'FULLSCREEN_EXITED', 'COPY_ATTEMPTED', 'LARGE_PASTE_DETECTED'].includes(e.eventType)
  );

  const groupedViolations = securityViolations.reduce((acc, event) => {
    const label = getEventLabel(event);
    if (!acc[label]) {
      acc[label] = {
        label,
        count: 0,
        eventType: event.eventType,
        lastEvent: event,
        allEvents: []
      };
    }
    acc[label].count += 1;
    acc[label].allEvents.push(event);
    // Keep track of the most recent event
    if (new Date(event.createdAt) > new Date(acc[label].lastEvent.createdAt)) {
      acc[label].lastEvent = event;
    }
    return acc;
  }, {} as Record<string, any>);

  const aggregatedViolations = Object.values(groupedViolations);

  return (
    <div className="cdr-container">
      {/* Header */}
      <header className="cdr-header">
        <div className="cdr-header-left">
          <div className="cdr-avatar">
            <User size={20} color="#ea580c" />
          </div>
          <div className="cdr-info">
            <h1 className="cdr-title">{sessionData?.assessment_title || sessionReport?.assessment_title || 'Software Engineer Trainees'}</h1>
            <div className="cdr-meta">
              <span className="cdr-meta-item"><User size={14} /> {sessionData?.candidate_name || sessionReport?.candidate_name || 'Candidate Name'}</span>
              <span className="cdr-meta-item"><Mail size={14} /> {sessionData?.candidate_email || sessionReport?.candidate_email || 'candidate@example.com'}</span>
              {/* <span className="cdr-meta-item"><Calendar size={14} /> Invited Jul 25, 2026 by Shivesh Joshi</span> */}
            </div>
          </div>
        </div>

        <div className="cdr-header-right">
          {sessionData?.isPassed !== undefined && (
            <div className={`cdr-score-block ${sessionData.isPassed ? 'cdr-badge-pass' : 'cdr-badge-fail'}`}>
              <div className="cdr-score-value" style={{ color: sessionData.isPassed ? 'var(--color-success)' : 'var(--color-error)' }}>
                <span className="cdr-score-big">{sessionData.isPassed ? 'PASSED' : 'FAILED'}</span>
              </div>
              <div className="cdr-score-label">STATUS ({sessionData.passingPercentage}% req)</div>
            </div>
          )}
          {sessionData?.isPassed !== undefined && <div className="cdr-score-divider" />}
          
          <div className="cdr-score-block">
            <div className="cdr-score-value">
              <span className="cdr-score-big">{totalScore}</span> / {totalMax} pts
            </div>
            <div className="cdr-score-label">TOTAL SCORE</div>
          </div>

          <div className="cdr-score-divider" />

          <div className="cdr-score-block">
            <div className="cdr-score-value">
              <span className="cdr-score-big">{formatTime(totalTimeSeconds)}</span>
            </div>
            <div className="cdr-score-label">TIME TAKEN</div>
          </div>

          <button className="cdr-close-btn" onClick={() => navigate('/candidates')}>
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Security Overview */}
      {securityViolations.length > 0 && (
        <div className="cdr-security-overview">
          <div className="cdr-security-header">
            <ShieldAlert size={18} color="#ef4444" />
            <h2>Security Flags ({securityViolations.length} total events)</h2>
          </div>
          <div className="cdr-security-timeline">
            {aggregatedViolations.map((group, idx) => (
              <div 
                key={idx} 
                className="cdr-security-event" 
                title={`Occurred at:\n${group.allEvents.map((e: any) => formatEventTime(e.createdAt)).join('\n')}`}
              >
                <div className="cdr-se-icon">{getEventIcon(group.eventType)}</div>
                <div className="cdr-se-details">
                  <div className="cdr-se-label-row">
                    <span className="cdr-se-label">{group.label}</span>
                    <span className="cdr-se-count">{group.count} time{group.count > 1 ? 's' : ''}</span>
                  </div>
                  <span className="cdr-se-time">Last occurred: {formatEventTime(group.lastEvent.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row-based Layout Content */}
      <div className="cdr-scrollable-content">
        {questions.map((q, idx) => (
          <div key={q.id} className="cdr-question-row">
            {/* Left — Question List */}
            <div className="cdr-left-pane">
              <div className={`cdr-question-item ${idx === questions.length - 1 ? 'cdr-no-border' : ''}`}>
                <div className="cdr-q-header">
                  {q.attempted === false ? (
                    <XCircle size={20} color="#94a3b8" fill="#f1f5f9" />
                  ) : q.correct ? (
                    <CheckCircle2 size={20} color={q.score === q.maxScore ? '#22c55e' : '#f97316'} fill={q.score === q.maxScore ? '#dcfce7' : '#ffedd5'} />
                  ) : (
                    <XCircle size={20} color="#ef4444" fill="#fee2e2" />
                  )}
                  <h3>{idx + 1}. {q.title}</h3>
                  {editingScoreId === q.id ? (
                    <div className="score-override-wrapper" onClick={e => e.stopPropagation()}>
                      <input 
                        type="number" 
                        className="score-override-input"
                        value={editScoreValue}
                        onChange={e => setEditScoreValue(Number(e.target.value))}
                        min={0}
                        max={q.maxScore}
                        autoFocus
                      />
                      <span className="cdr-q-pts">/ {q.maxScore} pts</span>
                      <div className="score-override-actions">
                        <button className="score-override-btn save" onClick={() => handleEditScoreSave(q.id)}>
                          <Check size={16} />
                        </button>
                        <button className="score-override-btn cancel" onClick={handleEditScoreCancel}>
                          <XIcon size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="cdr-q-pts">
                      ({q.score} / {q.maxScore} pts)
                      {q.attempted && (sessionData?.status === 'completed' || (sessionData?.status as string)?.toUpperCase() === 'COMPLETED') && (
                        <button className="edit-score-btn" onClick={(e) => { e.stopPropagation(); handleEditScoreStart(q); }} title="Override Score">
                          <Edit2 size={14} />
                        </button>
                      )}
                    </span>
                  )}
                </div>

                <div className="cdr-q-box">
                  {q.body && <div className="markdown-body"><ReactMarkdown>{q.body}</ReactMarkdown></div>}
                  {q.codeSnippet && (
                    <>
                      <pre className="cdr-code-pre">{q.codeSnippet}</pre>
                      <button
                        className="cdr-copy-btn"
                        onClick={() => handleCopy(q.codeSnippet!, q.id)}
                        title="Copy code"
                      >
                        <Copy size={16} />
                        {copiedId === q.id && <span className="cdr-copy-tip">Copied!</span>}
                      </button>
                    </>
                  )}
                </div>

                <div className={`cdr-result-banner ${q.attempted === false ? 'unattempted' : (q.correct ? 'success' : 'error')}`}>
                  {q.attempted === false
                    ? <XCircle size={18} color="#64748b" />
                    : (q.correct
                      ? <CheckCircle2 size={18} color="#22c55e" />
                      : <XCircle size={18} color="#ef4444" />
                    )
                  }
                  <div className="cdr-result-text">
                    <strong style={q.attempted === false ? {color: '#64748b'} : {}}>{q.resultLabel}</strong>
                    <span className={q.correct ? 'cdr-text-orange' : ''}>{q.resultTag}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Answers */}
            <div className="cdr-right-pane">
              <div className="cdr-answer-block">
                <div className="cdr-a-header">
                  Candidate's answer{' '}
                  <span>(Time taken: {q.answer.timeTaken})</span>
                </div>

                {q.attempted === false ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-neutral-500)', fontStyle: 'italic', background: 'var(--color-surface)', borderRadius: '8px' }}>
                    Candidate did not attempt this question.
                  </div>
                ) : q.answer.type === 'mcq' ? (
                  <MCQAnswerBlock answer={q.answer} />
                ) : (
                  <>
                    <CodePlaybackPlayer answer={q.answer} questionId={q.id} />

                    {q.answer.correctAnswer && (
                      <div className="cdr-correct-answer-box">
                        <div className="cdr-ca-label">
                          <AlertTriangle size={14} color="#f97316" />
                          Correct answer
                        </div>
                        <div className="cdr-ca-content">
                          <div className="cdr-ca-dot" />
                          <pre className="cdr-ca-code">{q.answer.correctAnswer}</pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
