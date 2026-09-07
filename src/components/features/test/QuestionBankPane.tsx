import React, { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Info, X, List, Search, Code, AlignLeft, Plus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchBankQuestionsRequest, addQuestionToTest } from '../../../store/slices/assessmentSlice';
import type { Question } from '../../../types/models';

const TYPE_ICON: Record<string, React.ReactNode> = {
  mcq: <List size={14} />,
  coding: <Code size={14} />,
  free_text: <AlignLeft size={14} />,
};

const TYPE_TAG_CLASS: Record<string, string> = {
  mcq: 'tag-blue',
  coding: 'tag-green',
  free_text: 'tag-yellow',
};

const TYPE_LABEL: Record<string, string> = {
  mcq: 'MCQ',
  coding: 'Coding',
  free_text: 'Free Text',
};

// ─── Single draggable question card ──────────────────────────────────────────
const DraggableQuestionCard: React.FC<{ question: Question }> = ({ question }) => {
  const dispatch = useAppDispatch();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: question.id,
    data: { question },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} className="bank-card" {...attributes} {...listeners}>
      <div className="bank-card-content">
        <span className={TYPE_TAG_CLASS[question.question_type] + ' tag-sm'}>
          {TYPE_LABEL[question.question_type]}
        </span>
        <div className="bank-card-title">{question.title}</div>
      </div>
      <div className="bank-card-right">
        <span className="meta-item">{TYPE_ICON[question.question_type]}</span>
        <span className="pts">{'⭐'.repeat(question.difficulty || 1)}</span>
        <span className="time">{Math.ceil((question.estimated_time_seconds || (question as any).estimatedTimeSeconds || 300) / 60)}m</span>
        <button
          className="bank-add-btn"
          title="Add to test"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(addQuestionToTest(question.id));
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

// ─── QuestionBankPane ─────────────────────────────────────────────────────────
export const QuestionBankPane: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const bankQuestions = useAppSelector((s) => s.assessment.bankQuestions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchBankQuestionsRequest({
      search: searchQuery || undefined,
      type: filterType !== 'all' ? filterType : undefined,
      page: 1,
      limit: 100 // Fetch a large batch for the builder bank
    }));
  }, [dispatch, searchQuery, filterType]);

  const filtered = bankQuestions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || q.question_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <section className="question-bank-pane">
      <div className="pane-header">
        <div className="qbp-header-left">
          <h2 className="qbp-title">Question Bank</h2>
          <Info size={16} color="var(--color-neutral)" />
        </div>
        {onClose && (
          <button className="icon-btn" onClick={onClose}>
            <X size={20} color="var(--color-secondary)" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bank-search">
        <div className="search-field">
          <span className="search-field__icon"><Search size={16} /></span>
          <input
            type="text"
            className="search-field__input qbp-search-input"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bank-filters">
        <span className="filter-label">TYPE:</span>
        {(['all', 'mcq', 'coding', 'free_text'] as const).map((type) => (
          <button
            key={type}
            className={`filter-pill ${filterType === type ? 'filter-pill--active' : ''}`}
            onClick={() => setFilterType(type)}
          >
            {type === 'all' ? 'All' : TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="question-bank-list">
        {filtered.length === 0 ? (
          <div className="bank-empty-state">
            <p>No questions found.</p>
            {searchQuery && (
              <button className="link-btn" onClick={() => setSearchQuery('')}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          filtered.map((q) => <DraggableQuestionCard key={q.id} question={q} />)
        )}
      </div>
    </section>
  );
};
