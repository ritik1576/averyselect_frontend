import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Play, Send, ShieldAlert, X, Maximize, Camera, WifiOff, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import { GlobalLoader } from '../../components/ui';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import { publicService } from '../../services/api/public.service';
import { candidateService } from '../../services/api/candidate.service';
import { fetchTestPayloadRequest, submitTestRequest } from '../../store/slices/sessionSlice';

const Editor = React.lazy(() => import('@monaco-editor/react'));
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import './CandidateTestRunner.css';

interface TestCaseResult {
  testCaseId: number;
  label: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden?: boolean;
  timeMs?: number;
}

interface TerminalResult {
  status: 'passed' | 'failed' | 'running';
  statusText: string;
  output: string;
  stderr?: string;
  timeMs?: number;
  memoryKb?: number;
  language: string;
  testCaseResults?: TestCaseResult[];
  passCount?: number;
  totalCount?: number;
}

const LANGUAGE_TEMPLATES: Record<string, { label: string; monacoLang: string; starter: string }> = {
  javascript: {
    label: 'JavaScript (Node.js v20)',
    monacoLang: 'javascript',
    starter: `/**\n * Write your solution here.\n * You may define helper functions if needed.\n */\nfunction solution(input) {\n  return input;\n}\n\nmodule.exports = solution;`,
  },
  python: {
    label: 'Python (v3.12)',
    monacoLang: 'python',
    starter: `# Write your solution here.\n# You may define helper functions if needed.\ndef solution(input):\n    return input\n`,
  },
  cpp: {
    label: 'C++ (GCC v14.1)',
    monacoLang: 'cpp',
    starter: `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <map>\n#include <set>\n#include <unordered_map>\n#include <unordered_set>\nusing namespace std;\n\n// Write your solution here.\n// You may define helper functions above.\nstring solution(string input) {\n    return input;\n}`,
  },
  java: {
    label: 'Java (JDK v17)',
    monacoLang: 'java',
    starter: `import java.util.*;\n\npublic class Solution {\n    // Write your solution here.\n    // You may define helper functions.\n    public static Object solution(Object input) {\n        return input;\n    }\n}`,
  },
  sql: {
    label: 'SQL (SQLite 3)',
    monacoLang: 'sql',
    starter: `SELECT '[2]' AS result;`,
  },
};


export const CandidateTestRunner: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { testPayload, loading: sessionLoading, error: sessionError } = useAppSelector((state) => state.session);

  useEffect(() => {
    if (token) {
      dispatch(fetchTestPayloadRequest(token));
    }
  }, [dispatch, token]);

  // Storage keys for refresh persistence
  const STORAGE_KEY_ANSWERS = `test_answers_${token || 'demo'}`;
  const STORAGE_KEY_TIMER = `test_timer_${token || 'demo'}`;

  const candidateName = localStorage.getItem('candidate_name') || 'Jane Doe';
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Persistence: restore timer & answers if candidate refreshed page
  const [hasSavedTimer] = useState<boolean>(() => !!localStorage.getItem(STORAGE_KEY_TIMER));
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const savedTimer = localStorage.getItem(STORAGE_KEY_TIMER);
    return savedTimer ? parseInt(savedTimer, 10) : 3600; // 60 mins
  });

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
    if (savedAnswers) {
      try {
        return JSON.parse(savedAnswers);
      } catch (e) {
        console.error('Failed to parse saved answers, starting fresh', e);
        localStorage.removeItem(STORAGE_KEY_ANSWERS);
      }
    }
    return {};
  });

  const [selectedLanguages, setSelectedLanguages] = useState<Record<string, string>>({});
  const [codeOutputs, setCodeOutputs] = useState<Record<string, TerminalResult>>({});
  const [collapsedConsole, setCollapsedConsole] = useState<Record<string, boolean>>({});
  const [activeTestCaseTab, setActiveTestCaseTab] = useState<Record<string, number>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isTimeExpiredModalOpen, setIsTimeExpiredModalOpen] = useState(false);
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);

  // Tracks whether we are in a timer-triggered auto-submit flow.
  // Used by the post-submit useEffect to drive navigation on success/failure.
  const isAutoSubmittingRef = useRef<boolean>(false);

  // Network & Camera Edge Case State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cameraStatus, setCameraStatus] = useState<'active' | 'denied' | 'unavailable'>('active');

  // Security & Proctoring State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [securitySetting, setSecuritySetting] = useState<any>(null);

  useEffect(() => {
    if (token) {
      publicService.getAssessmentInfo(token).then((res: any) => {
        if (res.data?.securitySetting) {
          setSecuritySetting(res.data.securitySetting);
        }
        if (res.data?.durationMinutes && !hasSavedTimer) {
          setSecondsLeft(res.data.durationMinutes * 60);
        }
      }).catch((e: any) => console.error('Failed to load assessment info', e));
    }
  }, [token, STORAGE_KEY_TIMER]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const testQuestions = testPayload || [];
  const currentQ: any = testQuestions[currentIdx];
  const currentLangKey = selectedLanguages[currentQ?.id] || 'javascript';
  const currentLangConfig = LANGUAGE_TEMPLATES[currentLangKey] || LANGUAGE_TEMPLATES.javascript;
  const currentQLang = currentQ?.languages?.find((l: any) => l.languageName.toLowerCase() === currentLangKey.toLowerCase());
  const defaultStarterCode = currentQLang?.starterCode ?? currentLangConfig.starter;

  // Fullscreen Request Handler (Triggers on User Gesture)
  const handleEnterFullscreen = () => {
    const docElem = document.documentElement;
    if (docElem.requestFullscreen) {
      docElem.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => {
        console.warn('Fullscreen request failed:', err);
        setIsFullscreen(true); // Fallback
      });
    } else {
      setIsFullscreen(true);
    }
  };

  // Initialize Webcam Stream with Error/Denial Catching
  useEffect(() => {
    let streamToStop: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        streamToStop = s;
        setMediaStream(s);
        setCameraStatus('active');

        // Track stream disconnection
        const track = s.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            setCameraStatus('unavailable');
            setSecurityWarning('⚠️ Warning: Camera disconnected! Please reconnect your camera.');
          };
        }
      })
      .catch((err) => {
        console.warn('Webcam permission denied or camera unavailable:', err);
        setCameraStatus('denied');
        setTabSwitchCount((prev) => prev + 1);
        setSecurityWarning('⚠️ Camera access denied! Camera permission is required for webcam proctoring.');
      });

    return () => {
      streamToStop?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Attach Stream to Video element when ref and stream are ready
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(console.warn);
    }
  }, [mediaStream]);

  // Fullscreen & Tab Switch Listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (!isFS) {
        setTabSwitchCount((prev) => prev + 1);
        setSecurityWarning('⚠️ Warning: Fullscreen mode exited! You must stay in fullscreen during the assessment.');
        candidateService.logEvent('FULLSCREEN_EXITED').catch(console.error);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Security Event Listeners (Tab switch, window focus, Copy/Paste blocking)
  useEffect(() => {
    // If we haven't loaded settings yet, assume strictest to be safe, or wait. We will just use optional chaining with defaults.
    const enforceTabSwitch = securitySetting ? securitySetting.tabSwitchDetection : true;
    const enforceFocus = securitySetting ? securitySetting.windowFocusDetection : false;
    const enforceCopyPaste = securitySetting ? securitySetting.copyPasteBlocking : true;
    const enforceLargePaste = securitySetting ? securitySetting.largePasteDetection : false;
    const enforceUnusualActivity = securitySetting ? securitySetting.unusualActivityAlerts : false;

    const handleVisibilityChange = () => {
      if (document.hidden && enforceTabSwitch) {
        setTabSwitchCount((prev) => prev + 1);
        setSecurityWarning('⚠️ Warning: Tab switch detected! Leaving the assessment tab is strictly recorded.');
        candidateService.logEvent('TAB_SWITCHED').catch(console.error);
      }
    };

    const handleBlur = () => {
      if (enforceFocus) {
        setSecurityWarning('⚠️ Warning: Window lost focus! Please stay inside the assessment window.');
        candidateService.logEvent('TAB_SWITCHED', { reason: 'window_blur' }).catch(console.error);
      }
    };

    const handleCopyCut = (e: ClipboardEvent) => {
      if (enforceCopyPaste) {
        e.preventDefault();
        setSecurityWarning('⚠️ Copying is disabled during this proctored assessment.');
        candidateService.logEvent('COPY_ATTEMPTED').catch(console.error);
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (enforceCopyPaste) {
        e.preventDefault();
        setSecurityWarning('⚠️ Pasting is disabled during this proctored assessment.');
        candidateService.logEvent('COPY_ATTEMPTED', { reason: 'paste_blocked' }).catch(console.error);
      } else if (enforceLargePaste) {
        const pastedData = e.clipboardData?.getData('text') || '';
        if (pastedData.length > 100) {
          setTabSwitchCount((prev) => prev + 1);
          setSecurityWarning('⚠️ Warning: Large paste detected. This activity has been recorded.');
          candidateService.logEvent('LARGE_PASTE_DETECTED', { length: pastedData.length }).catch(console.error);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (enforceCopyPaste) {
        e.preventDefault();
        setSecurityWarning('⚠️ Right-click context menu is disabled during the assessment.');
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (enforceUnusualActivity) {
        // Triggers when mouse leaves the document window (e.g. moving towards URL bar or another monitor)
        if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
           setSecurityWarning('⚠️ Warning: Mouse left the assessment window. Unusual activity recorded.');
           candidateService.logEvent('TAB_SWITCHED', { reason: 'mouse_leave' }).catch(console.error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [securitySetting]);

  // Network Status Listener (Offline/Online)
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setSecurityWarning(null);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Accidental Tab Closure Listener (onbeforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Unsubmitted test progress will be lost.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Save Answers & Timer to LocalStorage on Change (Refresh Persistence)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers));
  }, [answers, STORAGE_KEY_ANSWERS]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TIMER, secondsLeft.toString());
  }, [secondsLeft, STORAGE_KEY_TIMER]);


  // Observer: fires when sessionLoading transitions false after auto-submit.
  // If the submit succeeded, navigate to /submitted.
  // If it failed, clear the auto-submit flag so the expiry modal stays visible
  // and the candidate can see the error (toast is shown by the saga).
  useEffect(() => {
    if (!isAutoSubmittingRef.current) return;
    if (sessionLoading) return; // still in flight
    // Loading just went false — submission has resolved
    if (!sessionError) {
      // Success — navigate
      isAutoSubmittingRef.current = false;
      localStorage.removeItem(STORAGE_KEY_ANSWERS);
      localStorage.removeItem(STORAGE_KEY_TIMER);
      navigate(`/take/${token || 'demo'}/submitted`);
    } else {
      // Failure — remain on expiry modal, let the saga toast show the error
      isAutoSubmittingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, sessionError]);

  // Timer Countdown with 00:00 Auto-Submit Edge Case
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Show the expiry modal then trigger the authoritative submission flow.
          // Navigation happens in the post-submit observer useEffect (above) once
          // the saga signals success. On failure the modal stays up and the saga
          // toast informs the candidate.
          setIsTimeExpiredModalOpen(true);
          // Use a short delay so the modal renders before the network work starts.
          setTimeout(() => {
            // Capture current in-memory answers (fresher than localStorage).
            // answersRef is read inside setSecondsLeft's closure, but answers/selectedLanguages
            // are captured via the dependency array below.
            isAutoSubmittingRef.current = true;
            dispatch(submitTestRequest({ answers, selectedLanguages }));
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // answers and selectedLanguages are intentionally included so the closure
  // captures the latest values at expiry time.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, token, STORAGE_KEY_ANSWERS, STORAGE_KEY_TIMER, dispatch, answers, selectedLanguages]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optId: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optId }));
  };

  const keystrokeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCodeChange = (value: string | undefined) => {
    const code = value || '';
    setAnswers((prev) => ({ ...prev, [currentQ.id]: code }));

    // Throttle keystroke logging (1s) to capture active typing
    if (!keystrokeTimeoutRef.current) {
      keystrokeTimeoutRef.current = setTimeout(() => {
        candidateService.logEvent('CODE_CHANGED', {
          questionId: currentQ.id,
          code: code
        }).catch(err => console.error('Failed to log keystroke:', err));
        keystrokeTimeoutRef.current = null;
      }, 1000);
    }
  };

  const handleFreeTextChange = (text: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: text }));
  };


  const handleLanguageChange = (langKey: string) => {
    setSelectedLanguages((prev) => ({ ...prev, [currentQ.id]: langKey }));
    // Reset code answer to starter template for new language if not edited
    const qLang = currentQ?.languages?.find((l: any) => l.languageName.toLowerCase() === langKey.toLowerCase());
    const newTemplate = qLang?.starterCode ?? LANGUAGE_TEMPLATES[langKey]?.starter ?? '';
    setAnswers((prev) => ({ ...prev, [currentQ.id]: newTemplate }));
  };

  const handleRunCode = async () => {
    const code = answers[currentQ.id] ?? defaultStarterCode;
    setIsExecuting(true);
    setCollapsedConsole((prev) => ({ ...prev, [currentQ.id]: false }));

    setCodeOutputs((prev) => ({
      ...prev,
      [currentQ.id]: {
        status: 'running',
        statusText: `Running test cases on ${currentLangConfig.label}...`,
        output: 'Evaluating solution against test cases...',
        language: currentLangConfig.label,
      },
    }));

    try {
      // Delegate all execution to the shared backend engine.
      // The backend securely reads executionMode and functionContract from the DB.
      const engineResult = await candidateService.runCode(
        currentQ.id,
        code,
        currentLangKey
      );

      const testCaseResults: TestCaseResult[] = (engineResult.testCaseResults ?? []).map(
        (tcr: any, idx: number) => ({
          testCaseId: tcr.testCaseId,
          label: `Case ${idx + 1}`,
          input: (currentQ.testCases ?? []).find((tc: any) => tc.id === tcr.testCaseId)?.input ?? '',
          expectedOutput: (currentQ.testCases ?? []).find((tc: any) => tc.id === tcr.testCaseId)?.expectedOutput ?? '',
          actualOutput: tcr.error ? `Error: ${tcr.error}` : (tcr.output ?? '(No output returned)'),
          passed: !!tcr.passed,
          isHidden: false,
          timeMs: tcr.executionTimeMs,
        })
      );

      const passCount = engineResult.passCount ?? 0;
      const totalCount = engineResult.totalCount ?? testCaseResults.length;
      const allPassed = engineResult.status === 'PASSED';
      const hasError = engineResult.status === 'ERROR';

      setCodeOutputs((prev) => ({
        ...prev,
        [currentQ.id]: {
          status: allPassed ? 'passed' : 'failed',
          statusText: hasError
            ? `Execution Error`
            : `${passCount}/${totalCount} test cases passed`,
          output: engineResult.output ?? '',
          stderr: engineResult.fatalError ?? undefined,
          language: currentLangConfig.label,
          timeMs: engineResult.executionTimeMs,
          testCaseResults,
          passCount,
          totalCount,
        },
      }));
    } catch (err: any) {
      setCodeOutputs((prev) => ({
        ...prev,
        [currentQ.id]: {
          status: 'failed',
          statusText: 'Network or server error',
          output: err?.response?.data?.message || err?.message || 'Unknown error',
          language: currentLangConfig.label,
        },
      }));
    } finally {
      setIsExecuting(false);
    }
  };

  // (Legacy useEffect placeholder — kept for structural integrity)
  useEffect(() => {
    // If we wanted to, we could track submit success here and then navigate.
    // For now we'll just navigate immediately to avoid the user getting stuck if it's slow.
    // Wait, the original code had navigate immediately. Let's keep it but put it inside the function.
  }, []);


  const handleSubmitFinal = () => {
    setIsSubmitModalOpen(false);
    dispatch(submitTestRequest({ answers, selectedLanguages }));
    localStorage.removeItem(STORAGE_KEY_ANSWERS);
    localStorage.removeItem(STORAGE_KEY_TIMER);
    navigate(`/take/${token || 'demo'}/submitted`);
  };

  if (!currentQ) {
    return <GlobalLoader fullScreen text="Loading Test Environment..." />;
  }

  return (
    <div className="tr-container page-fade-in">
      {/* Network Offline Alert Banner */}
      {isOffline && (
        <div className="tr-network-banner">
          <WifiOff size={18} />
          <span>⚠️ Connection Lost: You are currently offline. Your progress is saved locally and will sync when reconnected.</span>
        </div>
      )}

      {/* Top Security Warning Toast Banner */}
      {securityWarning && (
        <div className="tr-security-banner">
          <div className="tr-sb-content">
            <ShieldAlert size={18} />
            <span>{securityWarning}</span>
          </div>
          <button className="tr-sb-close" onClick={() => setSecurityWarning(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Floating Webcam Proctoring Feed */}
      <div className="tr-webcam-preview active">
        {mediaStream && cameraStatus === 'active' ? (
          <video ref={videoRef} autoPlay playsInline muted />
        ) : (
          <div className={`tr-webcam-placeholder ${cameraStatus === 'denied' ? 'denied' : ''}`}>
            <Camera size={22} color={cameraStatus === 'denied' ? '#ef4444' : '#ef4623'} />
            <span>{cameraStatus === 'denied' ? 'Camera Blocked' : 'Camera Active'}</span>
          </div>
        )}
        <div className="tr-webcam-badge">
          <span className={`tr-rec-dot ${cameraStatus === 'denied' ? 'denied' : ''}`} /> PROCTORED
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="tr-header">
        <div className="tr-header-left">
          <span className="tr-brand-badge">Assessment Portal</span>
          <h2 className="tr-test-title">Frontend Developer Assessment</h2>
        </div>

        <div className="tr-header-center">
          <div className="tr-progress-pill" onClick={() => setIsGridModalOpen(true)} title="Click to view full Question Matrix">
            <span>Question <strong>{currentIdx + 1}</strong> of {testQuestions.length}</span>
            <LayoutGrid size={14} className="tr-grid-icon" />
          </div>
        </div>

        <div className="tr-header-right">
          {!isFullscreen && (
            <button className="tr-fs-btn" onClick={handleEnterFullscreen}>
              <Maximize size={14} /> Enable Fullscreen
            </button>
          )}
          {tabSwitchCount > 0 && (
            <div className="tr-violation-badge">
              <ShieldAlert size={14} />
              <span>{tabSwitchCount} Warning{tabSwitchCount > 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="tr-timer-badge">
            <Clock size={16} color="#ea580c" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>
          <div className="tr-candidate-pill">
            <span>{candidateName}</span>
          </div>
        </div>
      </header>

      {/* Main Split Content Workspace */}
      <div className="tr-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="tr-body-inner"
          >
            {/* Left Pane — Question Description */}
            <div className="tr-left-pane">
              <div className="tr-q-meta">
                <span className="tr-tag-domain">
                  {currentQ.type === 'code' ? 'Coding Exercise' : 
                   currentQ.type === 'mcq' ? 'Multiple Choice' : 'Free Text'}
                </span>
                <span className="tr-tag-pts">+{currentQ.points} pts</span>
              </div>

              <h1 className="tr-q-title">{currentIdx + 1}. {currentQ.title}</h1>

              <div className="tr-q-desc">
                <ReactMarkdown>{currentQ.description || ''}</ReactMarkdown>
              </div>
            </div>

            {/* Right Pane — Interactive Answer Area */}
            <div className="tr-right-pane">
              {/* MCQ UI */}
              {currentQ.type === 'mcq' && (
                <div className="tr-mcq-wrapper">
                  <h3 className="tr-section-label">Select the correct option:</h3>
                  <div className="tr-options-list">
                    {currentQ.options?.map((opt: { id: string, label: string, text: string }) => {
                      const isSelected = answers[currentQ.id] === opt.id;
                      return (
                        <div 
                          key={opt.id}
                          className={`tr-option-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectOption(opt.id)}
                        >
                          <div className="tr-option-label">{opt.label}</div>
                          <div className="tr-option-text">{opt.text}</div>
                          {isSelected && <CheckCircle2 size={20} color="#ef4623" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

          {/* Coding Editor UI */}
          {currentQ.type === 'code' && (
            <div className="tr-code-wrapper">
              <div className="tr-code-toolbar">
                <div className="tr-lang-selector-group">
                  <label htmlFor="lang-select">Language:</label>
                  <select
                    id="lang-select"
                    className="tr-lang-select"
                    value={currentLangKey}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    {Object.entries(LANGUAGE_TEMPLATES).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="tr-run-btn" onClick={handleRunCode} disabled={isExecuting}>
                  <Play size={14} /> {isExecuting ? 'Running...' : 'Run Code'}
                </button>
              </div>

              <div className="tr-editor-container">
                <Suspense fallback={<GlobalLoader />}>
                  <Editor 
                    height="380px"
                    language={currentLangConfig.monacoLang}
                    theme="vs-dark"
                    value={answers[currentQ.id] ?? defaultStarterCode}
                    onChange={handleCodeChange}
                    options={{ 
                      fontSize: 14, 
                      minimap: { enabled: false },
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                    }}
                  />
                </Suspense>
              </div>

              {codeOutputs[currentQ.id] && (
                <div className={`tr-console-card ${collapsedConsole[currentQ.id] ? 'collapsed' : ''}`}>
                  <div className="tr-console-top-row">
                    <div className={`tr-status-pill ${codeOutputs[currentQ.id].status}`}>
                      {codeOutputs[currentQ.id].status === 'passed' && <CheckCircle2 size={15} />}
                      {codeOutputs[currentQ.id].status === 'failed' && <AlertTriangle size={15} />}
                      <span>{codeOutputs[currentQ.id].statusText}</span>
                    </div>

                    <div className="tr-console-header-actions">
                      {codeOutputs[currentQ.id].status !== 'running' && (
                        <div className="tr-console-metrics">
                          <span>⏱ {codeOutputs[currentQ.id].timeMs}ms</span>
                          {codeOutputs[currentQ.id].memoryKb && (
                            <span>💾 {(codeOutputs[currentQ.id].memoryKb! / 1024).toFixed(1)} MB</span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        className="tr-console-toggle-btn"
                        onClick={() => setCollapsedConsole((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                        title={!collapsedConsole[currentQ.id] ? 'Minimize Test Results' : 'Expand Test Results'}
                      >
                        {!collapsedConsole[currentQ.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        <span>{!collapsedConsole[currentQ.id] ? 'Minimize' : 'Expand'}</span>
                      </button>
                    </div>
                  </div>

                  {!collapsedConsole[currentQ.id] && (
                    <>
                      {/* Test Cases Results Tabs */}
                  {codeOutputs[currentQ.id].testCaseResults && (
                    <div className="tr-tc-tabs">
                      {codeOutputs[currentQ.id].testCaseResults!.map((tc) => {
                        const activeId = activeTestCaseTab[currentQ.id] || codeOutputs[currentQ.id].testCaseResults![0].testCaseId;
                        const isSelected = activeId === tc.testCaseId;
                        return (
                          <button
                            key={tc.testCaseId}
                            className={`tr-tc-tab-btn ${isSelected ? 'active' : ''} ${tc.passed ? 'passed' : 'failed'}`}
                            onClick={() => setActiveTestCaseTab((prev) => ({ ...prev, [currentQ.id]: tc.testCaseId }))}
                          >
                            <span className={`tr-tc-dot ${tc.passed ? 'passed' : 'failed'}`} />
                            {tc.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="tr-console-body">
                    {/* Active Test Case Detail */}
                    {codeOutputs[currentQ.id].testCaseResults && (
                      (() => {
                        const activeId = activeTestCaseTab[currentQ.id] || codeOutputs[currentQ.id].testCaseResults![0].testCaseId;
                        const activeTc = codeOutputs[currentQ.id].testCaseResults!.find((t) => t.testCaseId === activeId);
                        if (!activeTc) return null;
                        return (
                          <div className="tr-tc-detail-card">
                            <div className="tr-tc-field full-width">
                              <span className="tr-tc-field-label">INPUT ARGUMENTS</span>
                              <pre className="tr-tc-field-val">{activeTc.input}</pre>
                            </div>
                            <div className="tr-tc-field">
                              <span className="tr-tc-field-label">EXPECTED OUTPUT</span>
                              <pre className="tr-tc-field-val expected">{activeTc.expectedOutput}</pre>
                            </div>
                            <div className="tr-tc-field">
                              <span className="tr-tc-field-label">
                                ACTUAL OUTPUT {activeTc.passed ? '✓ PASSED' : '✖ MISMATCH'}
                              </span>
                              <pre className={`tr-tc-field-val ${activeTc.passed ? 'passed' : 'failed'}`}>
                                {activeTc.actualOutput}
                              </pre>
                            </div>
                          </div>
                        );
                      })()
                    )}

                    {!codeOutputs[currentQ.id].testCaseResults && codeOutputs[currentQ.id].output && (
                      <pre className="tr-output-code">{codeOutputs[currentQ.id].output}</pre>
                    )}

                    {codeOutputs[currentQ.id].stderr && (
                      <div className="tr-error-section">
                        <div className="tr-error-label">COMPILER / RUNTIME TRACEBACK</div>
                        <pre className="tr-error-code">{codeOutputs[currentQ.id].stderr}</pre>
                      </div>
                    )}
                  </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free Text UI */}
          {currentQ.type === 'free_text' && (
            <div className="tr-text-wrapper">
              <h3 className="tr-section-label">Your Response:</h3>
              <textarea 
                className="tr-textarea"
                rows={10}
                placeholder="Type your explanation or response here..."
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleFreeTextChange(e.target.value)}
              />
            </div>
          )}
          </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Bottom Navigation Bar */}
      <footer className="tr-footer">
        <button 
          className="tr-nav-btn"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
        >
          <ChevronLeft size={18} /> Previous
        </button>

        <div className="tr-footer-dots">
          {testQuestions.map((q: any, idx: number) => (
            <button
              key={q.id}
              className={`tr-dot ${idx === currentIdx ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
              onClick={() => setCurrentIdx(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentIdx < testQuestions.length - 1 ? (
          <button 
            className="tr-nav-btn tr-primary"
            onClick={() => setCurrentIdx((i) => i + 1)}
          >
            Next Question <ChevronRight size={18} />
          </button>
        ) : (
          <button 
            className="tr-submit-btn"
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Submit Assessment <Send size={16} />
          </button>
        )}
      </footer>

      {/* Question Grid Matrix Drawer Modal */}
      {isGridModalOpen && (
        <div className="tr-modal-overlay" onClick={() => setIsGridModalOpen(false)}>
          <div className="tr-modal tr-grid-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tr-grid-header">
              <h3>Question Matrix Navigation</h3>
              <button className="tr-sb-close" onClick={() => setIsGridModalOpen(false)}>
                <X size={18} color="#64748b" />
              </button>
            </div>
            
            <div className="tr-grid-legend">
              <div className="tr-legend-item"><span className="tr-dot-sample answered" /> Answered ({Object.keys(answers).length})</div>
              <div className="tr-legend-item"><span className="tr-dot-sample unanswered" /> Remaining ({testQuestions.length - Object.keys(answers).length})</div>
            </div>

            <div className="tr-matrix-grid">
              {testQuestions.map((q: any, idx: number) => (
                <button
                  key={q.id}
                  className={`tr-matrix-btn ${idx === currentIdx ? 'current' : ''} ${answers[q.id] ? 'answered' : ''}`}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setIsGridModalOpen(false);
                  }}
                >
                  <span className="tr-matrix-num">{idx + 1}</span>
                  <span className="tr-matrix-type">{q.type?.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Required Recovery Overlay Modal */}
      {(!isFullscreen && (securitySetting ? securitySetting.fullscreenRequired : true)) && (
        <div className="tr-modal-overlay">
          <div className="tr-modal">
            <ShieldAlert size={44} color="#ef4623" />
            <h2>Fullscreen Mode Required</h2>
            <p>This assessment requires fullscreen mode to maintain test integrity. Exiting fullscreen is logged for recruiter evaluation.</p>
            <button className="cw-start-btn" onClick={handleEnterFullscreen} style={{ width: '100%' }}>
              <Maximize size={18} /> Enter Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* Time Expired Auto-Submit Modal */}
      {isTimeExpiredModalOpen && (
        <div className="tr-modal-overlay">
          <div className="tr-modal">
            <Clock size={44} color="#ef4623" />
            <h2>Time Expired!</h2>
            <p>Your assessment duration has ended. Automatically submitting your recorded responses now...</p>
            <div className="tr-spinner" />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="tr-modal-overlay">
          <div className="tr-modal">
            <AlertTriangle size={36} color="#ef4623" />
            <h2>Ready to Submit?</h2>
            <p>You have answered {Object.keys(answers).length} out of {testQuestions.length} questions. You cannot change your answers after submitting.</p>
            <div className="tr-modal-actions">
              <button className="btn-secondary" onClick={() => setIsSubmitModalOpen(false)}>Continue Assessment</button>
              <button className="cw-start-btn" onClick={handleSubmitFinal}>Yes, Submit Test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
