import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { GripVertical, AlignLeft, Clock, Code, List, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { removeQuestionFromTest, fetchBankQuestionsRequest } from '../../../store/slices/assessmentSlice';
import type { AssessmentQuestion } from '../../../store/slices/assessmentSlice';

const TYPE_ICON: Record<string, React.ReactNode> = {
  mcq: <List size={13} />,
  coding: <Code size={13} />,
  free_text: <AlignLeft size={13} />,
};

const TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple Choice',
  coding: 'Coding',
  free_text: 'Free Text',
};

// ─── Single sortable question card ───────────────────────────────────────────
const SortableQuestionCard: React.FC<{ question: AssessmentQuestion }> = ({ question }) => {
  const dispatch = useAppDispatch();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="question-build-card">
      <div className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={20} color="#cbd5e1" />
      </div>
      <div className="question-build-content">
        <div className="card-tags">
          <span className="tag-blue">{TYPE_LABEL[question.question_type]}</span>
          {'⭐'.repeat(question.difficulty || 1)}
        </div>
        <div className="tbp-card-title">{question.title}</div>
        <div className="card-meta mt-2">
          <span className="meta-item">{TYPE_ICON[question.question_type]} {question.points} pts</span>
          <span className="meta-item">
            <Clock size={13} /> {Math.ceil((question.estimated_time_seconds || (question as any).estimatedTimeSeconds || 300) / 60)} min
          </span>
        </div>
      </div>
      <button
        className="remove-from-test-btn"
        title="Remove from test"
        onClick={() => dispatch(removeQuestionFromTest(question.id))}
      >
        <X size={16} />
      </button>
    </div>
  );
};

// ─── Droppable empty state ────────────────────────────────────────────────────
const DroppableEmptyState: React.FC = () => {
  const { setNodeRef, isOver } = useDroppable({ id: 'test-build-drop-zone' });
  return (
    <div
      ref={setNodeRef}
      className={`test-build-drop-zone ${isOver ? 'test-build-drop-zone--over' : ''}`}
    >
      <div className="drop-zone-icon">📋</div>
      <p className="drop-zone-text">Drag questions here from the Question Bank</p>
      <p className="drop-zone-subtext">or use the button above to browse questions</p>
    </div>
  );
};

// ─── TestBuildPane ────────────────────────────────────────────────────────────
export const TestBuildPane: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedQuestions = useAppSelector((s) => s.assessment.selectedQuestions);

  React.useEffect(() => {
    dispatch(fetchBankQuestionsRequest());
  }, [dispatch]);

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);
  const totalMinutes = selectedQuestions.reduce(
    (sum, q) => sum + Math.ceil((q.estimated_time_seconds || 300) / 60),
    0
  );

  return (
    <section className="test-build-pane">
      <div className="pane-header">
        <h2 className="qbp-title">
          Your Test Build
          {selectedQuestions.length > 0 && (
            <span className="pane-count-badge">{selectedQuestions.length}</span>
          )}
        </h2>

      </div>

      {selectedQuestions.length > 0 && (
        <div className="pane-summary-bar">
          <span>{selectedQuestions.length} questions</span>
          <span>·</span>
          <span>{totalPoints} pts total</span>
          <span>·</span>
          <span>~{totalMinutes} min</span>
        </div>
      )}

      {selectedQuestions.length === 0 ? (
        <DroppableEmptyState />
      ) : (
        <SortableContext
          items={selectedQuestions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="test-build-list">
            {selectedQuestions.map((q) => (
              <SortableQuestionCard key={q.id} question={q} />
            ))}
          </div>
        </SortableContext>
      )}
    </section>
  );
};
