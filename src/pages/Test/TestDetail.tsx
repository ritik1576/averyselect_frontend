import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Info, Copy, Check, Loader2, Save, Mail, AlertTriangle, Globe, EyeOff } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, closestCenter } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { TestSettings } from './TestSettings';
import { TestBuildPane } from '../../components/features/test/TestBuildPane';
import { QuestionBankPane } from '../../components/features/test/QuestionBankPane';
import { TestCandidatesTable } from '../../components/features/test/TestCandidatesTable';
import { InviteCandidatesModal } from '../../components/features/test/InviteCandidatesModal';
import { TableSkeleton } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addQuestionToTest, reorderTestQuestions, updateAssessmentQuestionsRequest, setTestQuestions, updateAssessmentRequest } from '../../store/slices/assessmentSlice';
import { assessmentService } from '../../services/api/assessment.service';
import type { Assessment } from '../../types';
import './TestDetail.css';

export const TestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'candidates' | 'questions' | 'settings'>('questions');
  const [isPublished, setIsPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const dispatch = useAppDispatch();
  const bankQuestions = useAppSelector((s) => s.assessment.bankQuestions);
  // Temporarily use Redux for selected questions until we fully wire up saving
  const selectedQuestions = useAppSelector((s) => s.assessment.selectedQuestions);
  const hasUnsavedChanges = useAppSelector((s) => s.assessment.hasUnsavedChanges);
  const isSaving = useAppSelector((s) => s.assessment.loading);

  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [prevSaving, setPrevSaving] = useState(false);

  const fetchAssessmentAndLinks = useCallback(async (showLoading = true) => {
    if (!id) return;
    try {
      if (showLoading) setIsLoading(true);
      const [res, linksRes] = await Promise.all([
        assessmentService.getById(id),
        assessmentService.getLinks(id)
      ]);
      setAssessment(res.data);
      if ((res.data as any).questions) {
        dispatch(setTestQuestions((res.data as any).questions));
      }
      if (linksRes.data && linksRes.data.length > 0) {
        setPublicToken(linksRes.data[0].token);
      }
      setIsPublished(Boolean((res.data as any).isPublished));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch test details');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [id, dispatch]);

  useEffect(() => {
    fetchAssessmentAndLinks();
  }, [fetchAssessmentAndLinks]);

  // Refetch when save completes (isSaving transitions from true to false)
  useEffect(() => {
    if (prevSaving && !isSaving) {
      fetchAssessmentAndLinks(false); // Silently refetch to update TestDetail's local state
    }
    setPrevSaving(isSaving);
  }, [isSaving, prevSaving, fetchAssessmentAndLinks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handlePublish = async () => {
    if (!id) return;
    try {
      let token = publicToken;
      if (!token) {
        const res = await assessmentService.createLink(id);
        token = res.data.token;
        setPublicToken(token);
      }
      
      await assessmentService.update(id, { isPublished: true });
      dispatch(updateAssessmentRequest({ id, data: { isPublished: true } }));
      
      setIsPublished(true);
      if (assessment) {
        setAssessment({ ...assessment, isPublished: true });
      }
      toast.success('Assessment published successfully!');
    } catch (err: any) {
      console.error('Failed to publish', err);
      toast.error(err.response?.data?.message || 'Failed to publish assessment');
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    try {
      await assessmentService.update(id, { isPublished: false });
      dispatch(updateAssessmentRequest({ id, data: { isPublished: false } }));
      
      setIsPublished(false);
      if (assessment) {
        setAssessment({ ...assessment, isPublished: false });
      }
      toast.success('Assessment unpublished to Draft.');
    } catch (err: any) {
      console.error('Failed to unpublish', err);
      toast.error(err.response?.data?.message || 'Failed to unpublish assessment');
    }
  };

  const handleCopyLink = () => {
    if (publicToken) {
      navigator.clipboard.writeText(`${window.location.origin}/take/${publicToken}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped onto the build zone (empty state drop target)
    if (overId === 'test-build-drop-zone') {
      const inBank = bankQuestions.find((q) => q.id === activeId);
      if (inBank) {
        dispatch(addQuestionToTest(activeId));
      }
      return;
    }

    // If dragged from bank onto an existing card in the build list → add to test
    const isFromBank = bankQuestions.find((q) => q.id === activeId);
    const isOverSelected = selectedQuestions.find((q) => q.id === overId);
    if (isFromBank && isOverSelected) {
      dispatch(addQuestionToTest(activeId));
      return;
    }

    // If reordering within the build list
    const isInSelected = selectedQuestions.find((q) => q.id === activeId);
    if (isInSelected && isOverSelected && activeId !== overId) {
      dispatch(reorderTestQuestions({ activeId, overId }));
    }
  };

  const handleSaveQuestions = () => {
    if (!id) return;
    dispatch(
      updateAssessmentQuestionsRequest({
        id,
        questions: selectedQuestions.map((q) => ({ id: q.id, points: q.points })),
      })
    );
  };

  const activeDragQuestion = bankQuestions.find((q) => q.id === activeDragId) ??
    selectedQuestions.find((q) => q.id === activeDragId);

  // --- Calculate Time-Based Progress ---
  const totalEstimatedMinutes = selectedQuestions.reduce((sum, q) => sum + Math.ceil((q.estimated_time_seconds || (q as any).estimatedTimeSeconds || 300) / 60), 0);
  const targetMinutes = assessment?.duration_minutes || 60; // Fallback to 60 if missing
  const progressPercentage = targetMinutes > 0 ? Math.round((totalEstimatedMinutes / targetMinutes) * 100) : 0;
  const displayPercentage = Math.min(progressPercentage, 100);
  const isOverTime = progressPercentage > 100;
  // -------------------------------------

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="page-wrapper td-page">
        {isLoading ? (
          <div style={{ padding: '24px' }}>
            <TableSkeleton columns={4} rows={6} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem', color: '#ef4444' }}>
            <p>{error}</p>
            <Link to="/dashboard" className="btn-secondary">Return to Dashboard</Link>
          </div>
        ) : !assessment ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem', color: '#64748b' }}>
            <p>Assessment not found</p>
            <Link to="/dashboard" className="btn-secondary">Return to Dashboard</Link>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="td-header">
              <div className="td-header-left">
                <Link to="/dashboard" className="td-back-btn" aria-label="Back to Tests">
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="td-title">{assessment.title}</h1>
                {isPublished ? (
                  <span className="td-status-badge published">Published</span>
                ) : (
                  <span className="td-status-badge draft" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Draft</span>
                )}
              </div>
              <div className="td-header-actions">
                {hasUnsavedChanges && activeTab === 'questions' && (
                  <button
                    className="btn-primary"
                    onClick={handleSaveQuestions}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                    {isSaving ? 'Saving...' : 'Save Test'}
                  </button>
                )}
                {!isPublished ? (
                  <button className="btn-primary" onClick={handlePublish} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={16} />
                    <span>Publish Assessment</span>
                  </button>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={handleCopyLink} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                      <span>{copied ? 'Copied!' : 'Copy Public Link'}</span>
                    </button>
                    <button className="btn-secondary" onClick={handleUnpublish} title="Unpublish Assessment" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <EyeOff size={16} />
                      <span>Unpublish</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* TABS */}
            <div className="td-tabs">
              <button className={`td-tab ${activeTab === 'candidates' ? 'td-tab--active' : ''}`} onClick={() => setActiveTab('candidates')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                Candidates
              </button>
              <button className={`td-tab ${activeTab === 'questions' ? 'td-tab--active' : ''}`} onClick={() => setActiveTab('questions')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                Questions
              </button>
              <button className={`td-tab ${activeTab === 'settings' ? 'td-tab--active' : ''}`} onClick={() => setActiveTab('settings')}>
                <Settings size={14} />
                Settings
              </button>
            </div>

            {/* Active-session warning banner */}
            {(assessment as any)?.activeSessionCount > 0 && (
              <div className="td-active-session-banner">
                <AlertTriangle size={16} />
                <span>
                  <strong>{(assessment as any).activeSessionCount} candidate{(assessment as any).activeSessionCount > 1 ? 's are' : ' is'} currently taking this assessment.</strong>{' '}
                  Editing questions, duration, or pass percentage is disabled until all active sessions finish or expire.
                </span>
              </div>
            )}


            {activeTab === 'questions' && (
              <>
                {/* METRICS CARD */}
                <div className="test-metrics-card">
                  <div className="metric-group">
                    <div className="metric-circular-chart">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path
                          className="circle"
                          strokeDasharray={`${displayPercentage}, 100`}
                          style={isOverTime ? { stroke: 'var(--color-error)' } : undefined}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text
                          x="18"
                          y="20.35"
                          className="percentage"
                          style={isOverTime ? { fill: 'var(--color-error)' } : undefined}
                        >
                          {progressPercentage}%
                        </text>
                      </svg>
                    </div>
                    <div className="metric-info">
                      <span className="metric-label">TOTAL POINTS</span>
                      <span className="metric-value">{selectedQuestions.reduce((s, q) => s + q.points, 0)}</span>
                    </div>
                  </div>
                  <div className="metric-divider" />
                  <div className="metric-group">
                    <div className="metric-info">
                      <span className="metric-label">QUESTIONS</span>
                      <span className="metric-value">{selectedQuestions.length}</span>
                    </div>
                  </div>
                  <div className="metric-divider" />
                  <div className="metric-group">
                    <div className="metric-info">
                      <span className="metric-label">EST. TIME</span>
                      <span className="metric-value">
                        {selectedQuestions.length === 0 ? '—' : `${selectedQuestions.reduce((s, q) => s + Math.ceil((q.estimated_time_seconds || (q as any).estimatedTimeSeconds || 300) / 60), 0)}m`}
                      </span>
                    </div>
                  </div>
                  <div className="metric-divider" />
                  <div className="metric-group metric-expected">
                    <div className="expected-badge">
                      <span className="metric-label">BANK AVAILABLE <Info size={12} className="tc-icon-arrow" /></span>
                      <div className="expected-content">
                        <span className="expected-percentage">{bankQuestions.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="editor-split-layout">
                  <TestBuildPane />
                  <QuestionBankPane />
                </div>
              </>
            )}

            {activeTab === 'candidates' && (
              <TestCandidatesTable
                refreshTrigger={refreshKey}
                onInviteClick={() => setIsInviteModalOpen(true)}
              />
            )}

            {activeTab === 'settings' && assessment && <TestSettings assessment={assessment} />}
          </>
        )}
      </div>

      {/* Drag Overlay for visual feedback */}
      <DragOverlay>
        {activeDragQuestion ? (
          <div className="drag-overlay-card">
            <span className="drag-overlay-title">{activeDragQuestion.title}</span>
          </div>
        ) : null}
      </DragOverlay>

      {/* Invite Candidates Modal */}
      {assessment && (
        <InviteCandidatesModal
          assessmentId={assessment.id}
          assessmentTitle={assessment.title}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </DndContext>
  );
};
