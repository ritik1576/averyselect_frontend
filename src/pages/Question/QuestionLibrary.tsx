import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import {
  Plus, Search, ChevronDown,
  FileText, Code2, CheckSquare, MoreVertical, Code,
  Clock, AlignLeft, X, Check, List, Activity, AlertCircle
} from 'lucide-react';
import { formatTime } from '../../utils';
import { fetchQuestionsRequest, deleteQuestionRequest } from '../../store/slices/questionSlice';
import { StarRating } from '../../components/features/StarRating';
import { ConfirmModal, ListSkeleton } from '../../components/ui';
import { Pagination } from '../../components/ui/Pagination';
import './QuestionLibrary.css';

type FilterType = 'all' | 'coding' | 'mcq' | 'free_text';
type FilterDifficulty = 'all' | 1 | 2 | 3 | 4 | 5;

// We will dynamically compute ALL_DOMAINS from fetched questions inside the component

const TYPE_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'coding', label: 'Coding' },
  { value: 'mcq', label: 'MCQ' },
  { value: 'free_text', label: 'Free Text' },
];

const DIFFICULTY_OPTIONS: { value: FilterDifficulty; label: string }[] = [
  { value: 'all', label: 'All Difficulties' },
  { value: 1, label: '★ Beginner' },
  { value: 2, label: '★★ Easy' },
  { value: 3, label: '★★★ Medium' },
  { value: 4, label: '★★★★ Hard' },
  { value: 5, label: '★★★★★ Expert' },
];

const QUESTION_TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  coding:    { label: 'Code',    icon: Code2 },
  mcq:       { label: 'MCQ',     icon: List },
  free_text: { label: 'Project', icon: Activity },
};

export const QuestionLibrary: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<any | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { questions, meta, loading, error } = useAppSelector((state) => state.question);


  
  React.useEffect(() => {
    console.log('[QuestionLibrary] State updated:', JSON.stringify({ 
      questionsLength: questions?.length, 
      questionsIsArray: Array.isArray(questions),
      loading, 
      error,
      firstQuestionType: typeof questions?.[0]
    }));
  }, [questions, loading, error]);

  // ── Filter state ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');

  // Dropdown open states
  const [domainOpen, setDomainOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);

  const handleCreate = (type: string) => {
    navigate(`/dashboard/questions/create/${type}`);
    setIsCreateModalOpen(false);
  };

  const handleEdit = (q: any) => {
    const typePath = q.question_type === 'mcq' ? 'multiple-choice' : q.question_type === 'coding' ? 'coding' : 'free-text';
    navigate(`/dashboard/questions/edit/${typePath}/${q.id}`);
  };

  const confirmDelete = () => {
    if (questionToDelete) {
      dispatch(deleteQuestionRequest({ 
        id: questionToDelete.id, 
        onSuccess: () => {
          setDeleteModalOpen(false);
          setQuestionToDelete(null);
          dispatch(fetchQuestionsRequest({
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery,
          } as any));
        } 
      }));
    }
  };

  // ── Filtered questions ────────────────────────────────────────
  const filtered = questions || [];

  const itemsPerPage = 10;
  const totalItems = meta?.total || 0;
  const totalPages = (meta as any)?.totalPages || 1;
  const paginatedQuestions = filtered;

  // ── Derived metrics from filtered data ────────────────────────
  const metrics = useMemo(() => ({
    total: meta?.total || 0,
    coding: (meta as any)?.totalCoding || 0,
    mcq: (meta as any)?.totalMCQ || 0,
  }), [meta]);
  
  const allDomains = useMemo(() => {
    return Array.from(
      new Set((questions || []).flatMap((q: any) => q.domains ? q.domains.map((d: any) => d.domain_name) : []))
    ).sort() as string[];
  }, [questions]);

  const hasActiveFilters = searchQuery || filterDomain !== 'all' || filterType !== 'all' || filterDifficulty !== 'all';

  const clearAll = () => {
    setSearchQuery('');
    setFilterDomain('all');
    setFilterType('all');
    setFilterDifficulty('all');
    setCurrentPage(1);
  };



  // Close dropdowns on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.ql-dropdown-wrap')) {
        setDomainOpen(false);
        setTypeOpen(false);
        setDiffOpen(false);
      }
      if (!target.closest('.ql-kebab-container')) {
        setOpenKebabId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchQuestionsRequest({ page: 1, limit: itemsPerPage, search: searchQuery, type: filterType, difficulty: filterDifficulty, domain: filterDomain } as any));
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, currentPage, searchQuery, filterType, filterDifficulty, filterDomain]);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header-row">
        <h1 className="page-title">Question Library</h1>
        <div className="ql-header-actions">
          {/* <button className="btn-secondary">
            <Upload size={16} /> Bulk Import
          </button> */}
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} strokeWidth={3} /> Create Question
          </button>
        </div>
      </div>

      {/* Metrics — derived from filtered data */}
      <div className="ql-metrics-row">
        <div className="ql-metric-card">
          <div className="ql-metric-icon ql-metric-icon--orange">
            <FileText size={16} />
          </div>
          <div className="ql-metric-body">
            <span className="ql-metric-value">{metrics.total}</span>
            <span className="ql-metric-label">TOTAL QUESTIONS</span>
          </div>
        </div>
        <div className="ql-metric-card">
          <div className="ql-metric-icon ql-metric-icon--blue">
            <Code2 size={16} />
          </div>
          <div className="ql-metric-body">
            <span className="ql-metric-value">{metrics.coding}</span>
            <span className="ql-metric-label">CODING QUESTIONS</span>
          </div>
        </div>
        <div className="ql-metric-card">
          <div className="ql-metric-icon ql-metric-icon--gray">
            <CheckSquare size={16} />
          </div>
          <div className="ql-metric-body">
            <span className="ql-metric-value">{metrics.mcq}</span>
            <span className="ql-metric-label">MCQ QUESTIONS</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="ql-filter-bar">
        {/* Search */}
        <div className="search-field ql-flex-1 ql-search-wrap">
          <span className="search-field__icon"><Search size={18} /></span>
          <input
            type="text"
            className="search-field__input ql-w-100"
            placeholder="Search questions by title, domain, or keyword..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
          {searchQuery && (
            <button className="ql-search-clear" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="ql-filter-pills">
          {/* Domain Dropdown */}
          <div className="ql-dropdown-wrap">
            <button
              className={`cl-filter-pill ${filterDomain !== 'all' ? 'cl-filter-pill--active' : ''}`}
              onClick={() => { setDomainOpen((o) => !o); setTypeOpen(false); setDiffOpen(false); }}
            >
              {filterDomain === 'all' ? 'Domain' : filterDomain}
              <ChevronDown size={14} className={domainOpen ? 'rotated' : ''} />
            </button>
            {domainOpen && (
              <div className="ql-dropdown-panel">
                {['all', ...allDomains].map((d) => (
                  <button
                    key={d}
                    className={`ql-dropdown-item ${filterDomain === d ? 'ql-dropdown-item--active' : ''}`}
                    onClick={() => { setFilterDomain(d); setDomainOpen(false); setCurrentPage(1); }}
                  >
                    {d === 'all' ? 'All Domains' : d}
                    {filterDomain === d && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type Dropdown */}
          <div className="ql-dropdown-wrap">
            <button
              className={`cl-filter-pill ${filterType !== 'all' ? 'cl-filter-pill--active' : ''}`}
              onClick={() => { setTypeOpen((o) => !o); setDomainOpen(false); setDiffOpen(false); }}
            >
              {TYPE_OPTIONS.find((o) => o.value === filterType)?.label ?? 'Type'}
              <ChevronDown size={14} className={typeOpen ? 'rotated' : ''} />
            </button>
            {typeOpen && (
              <div className="ql-dropdown-panel">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`ql-dropdown-item ${filterType === opt.value ? 'ql-dropdown-item--active' : ''}`}
                    onClick={() => { setFilterType(opt.value); setTypeOpen(false); setCurrentPage(1); }}
                  >
                    {opt.label}
                    {filterType === opt.value && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty Dropdown */}
          <div className="ql-dropdown-wrap">
            <button
              className={`cl-filter-pill ${filterDifficulty !== 'all' ? 'cl-filter-pill--active' : ''}`}
              onClick={() => { setDiffOpen((o) => !o); setDomainOpen(false); setTypeOpen(false); }}
            >
              {DIFFICULTY_OPTIONS.find((o) => o.value === filterDifficulty)?.label ?? 'Difficulty'}
              <ChevronDown size={14} className={diffOpen ? 'rotated' : ''} />
            </button>
            {diffOpen && (
              <div className="ql-dropdown-panel">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.value)}
                    className={`ql-dropdown-item ${filterDifficulty === opt.value ? 'ql-dropdown-item--active' : ''}`}
                    onClick={() => { setFilterDifficulty(opt.value); setDiffOpen(false); setCurrentPage(1); }}
                  >
                    {opt.label}
                    {filterDifficulty === opt.value && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ql-filter-divider" />

          {hasActiveFilters && (
            <button className="btn-ghost ql-clear-btn" onClick={clearAll}>
              <X size={14} /> Clear Filters
            </button>
          )}

          {/* <button className="btn-ghost">
            <SlidersHorizontal size={14} /> More Filters
          </button> */}
        </div>
      </div>

      {/* Question List */}
      <div className="ql-list page-fade-in" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {(loading && questions.length === 0) ? (
           <ListSkeleton rows={5} />
        ) : error ? (
           <div className="ql-empty-state">
             <AlertCircle size={40} strokeWidth={1.5} className="ql-empty-icon" style={{ color: 'var(--color-error)', opacity: 1 }} />
             <div className="ql-empty-title" style={{ color: 'var(--color-error)' }}>Failed to load questions</div>
             <div className="ql-empty-subtitle" style={{ marginBottom: '16px' }}>Please check your connection and try again.</div>
             <button 
               className="btn-secondary" 
               onClick={() => dispatch(fetchQuestionsRequest({
                 page: currentPage,
                 limit: itemsPerPage,
                 search: searchQuery,
                 type: filterType,
                 difficulty: filterDifficulty,
                 domain: filterDomain
               }))}
             >
               Retry
             </button>
           </div>
        ) : paginatedQuestions.length === 0 ? (
          <div className="ql-empty-state">
            <FileText size={40} strokeWidth={1.5} className="ql-empty-icon" />
            <div className="ql-empty-title">No questions found</div>
            <div className="ql-empty-subtitle" style={{ marginBottom: hasActiveFilters ? '16px' : '0' }}>
              {hasActiveFilters 
                ? 'Try adjusting your search or filters to find what you are looking for.' 
                : 'Create your first question to get started.'}
            </div>
            {hasActiveFilters && (
              <button className="btn-secondary" onClick={clearAll}>Clear all filters</button>
            )}
          </div>
        ) : (
          paginatedQuestions.map((q) => {
            const typeMeta = QUESTION_TYPE_META[q.question_type];
            const TypeIcon = typeMeta?.icon;
            return (
              <div key={q.id} className="ql-card" onClick={() => handleEdit(q)} style={{ cursor: 'pointer' }}>
                <div className="ql-card-content">
                  <h3 className="ql-card-title">{q.title}</h3>
                  <div className="ql-card-meta">
                    {(q as any).domains && (q as any).domains.map((d: any) => (
                      <span key={d.id || d.domain_name} className="ql-tag">{d.domain_name}</span>
                    ))}
                    {typeMeta && (
                      <span className="ql-type-tag">
                        {TypeIcon && <TypeIcon size={12} />} {typeMeta.label}
                      </span>
                    )}
                    <StarRating count={Number((q as any).difficulty) || 1} />
                    <span className="ql-time-tag">
                      <Clock size={12} /> {formatTime(q.estimated_time_seconds)}
                    </span>
                  </div>
                </div>
                <div className="ql-kebab-container" style={{ position: 'relative' }}>
                  <button 
                    className="ql-kebab-btn" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setOpenKebabId(openKebabId === q.id ? null : q.id); 
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openKebabId === q.id && (
                    <div className="ql-dropdown-panel ql-dropdown-panel--right" style={{ right: 0, left: 'auto', top: '100%', minWidth: '120px' }}>
                      <button 
                        className="ql-dropdown-item" 
                        onClick={(e) => { e.stopPropagation(); handleEdit(q); }}
                      >
                        Edit
                      </button>
                      <button 
                        className="ql-dropdown-item" 
                        disabled={(q as any)._count?.assessments > 0}
                        title={(q as any)._count?.assessments > 0 ? "Cannot delete a question used in an assessment" : ""}
                        style={(q as any)._count?.assessments > 0 ? { color: 'var(--color-error)', opacity: 0.5, cursor: 'not-allowed' } : { color: 'var(--color-error)' }} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setQuestionToDelete(q); 
                          setDeleteModalOpen(true); 
                          setOpenKebabId(null); 
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {totalItems > 0 && (
          <div className="ql-list-footer">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} questions
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Question"
        message={<>Are you sure you want to delete <strong>{questionToDelete?.title}</strong>? This action cannot be undone.</>}
        confirmText="Delete"
        isLoading={loading}
      />

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="ql-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="ql-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ql-modal-header">
              <h2 className="ql-modal-title">Create New Question</h2>
              <button className="btn-ghost" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>
            <p className="ql-modal-subtitle">
              Select the type of question you would like to create.
            </p>
            <div className="ql-type-grid">
              <div className="ql-type-card" onClick={() => handleCreate('multiple-choice')}>
                <CheckSquare size={32} color="var(--color-primary)" />
                <h3>Multiple Choice</h3>
                <p>Evaluate knowledge with predefined single or multi-select answers.</p>
                <button className="btn-secondary ql-mt-auto">Create</button>
              </div>
              <div className="ql-type-card" onClick={() => handleCreate('free-text')}>
                <AlignLeft size={32} color="var(--color-primary)" />
                <h3>Free Text</h3>
                <p>Evaluate reasoning with open-ended written responses.</p>
                <button className="btn-secondary ql-mt-auto">Create</button>
              </div>
              <div className="ql-type-card" onClick={() => handleCreate('coding')}>
                <Code size={32} color="var(--color-primary)" />
                <h3>Coding Exercise</h3>
                <p>Evaluate technical skills with executable code environments.</p>
                <button className="btn-secondary ql-mt-auto">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
