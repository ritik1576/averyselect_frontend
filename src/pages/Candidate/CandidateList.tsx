import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown, Search, Download, ArrowUpDown, Info, X, Check, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { sessionService } from '../../services/api/session.service';
import { Pagination } from '../../components/ui';
import type { SessionStatus, CandidateSessionListItem } from '../../types';
import './CandidateList.css';

type SortField = 'test' | 'candidate' | 'started_at' | 'score';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS: { value: SessionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'expired', label: 'Expired' },
];

/** Export visible rows to a .csv file */
function exportToCSV(data: CandidateSessionListItem[]) {
  const headers = ['Test', 'Created At', 'Candidate Name', 'Email', 'Started At', 'Score', 'Status'];
  const rows = data.map((c) => [
    `"${c.assessment_title}"`,
    c.assessment_created_at,
    c.candidate_name,
    c.candidate_email,
    c.started_at ? new Date(c.started_at).toLocaleString() : '-',
    `${Number(c.percentage).toFixed(2).replace(/\.00$/, "")}%`,
    c.status,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `candidates_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const CandidateList: React.FC = () => {
  const navigate = useNavigate();

  // ── Filter / Sort / Pagination state ────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput]   = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [sortField, setSortField]       = useState<SortField>('started_at');
  const [sortDir, setSortDir]           = useState<SortDir>('desc');

  // ── Server-driven data ───────────────────────────────────────────
  const [sessions, setSessions]   = useState<CandidateSessionListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Map frontend sort field names → backend sortBy values
  const sortByMap: Record<SortField, 'startedAt' | 'candidateName' | 'assessmentTitle' | 'score'> = {
    started_at:  'startedAt',
    candidate:   'candidateName',
    test:        'assessmentTitle',
    score:       'score',
  };

  const fetchSessions = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await sessionService.getAll({
        page,
        limit:   ITEMS_PER_PAGE,
        search:  searchQuery || undefined,
        status:  statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined,
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo || undefined,
        sortBy:  sortByMap[sortField],
        sortDir,
      });
      setSessions(result.data);
      setTotalItems(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, dateFrom, dateTo, sortField, sortDir]);

  // Re-fetch when filters / sort change (also resets to page 1)
  useEffect(() => {
    setCurrentPage(1);
    fetchSessions(1);
  }, [fetchSessions]);

  // Re-fetch when page changes (without resetting to 1)
  const prevPage = useRef(1);
  useEffect(() => {
    if (currentPage !== prevPage.current) {
      prevPage.current = currentPage;
      fetchSessions(currentPage);
    }
  }, [currentPage, fetchSessions]);

  // Debounce search input → update searchQuery (which triggers fetchSessions)
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Dropdown open/close ──────────────────────────────────────────
  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen]     = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const dateRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (dateRef.current   && !dateRef.current.contains(e.target as Node))   setDateOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // ── Derived Metrics (from current page results — counts are approximate) ────
  // Full-count metrics would need a separate aggregate API; for now use visible data
  const metrics = useMemo(() => ({
    total:      totalItems,
    inProgress: sessions.filter(c => { const s = c.status.toLowerCase(); return s === 'in_progress' || s === 'started'; }).length,
    completed:  sessions.filter(c => c.status.toLowerCase() === 'completed').length,
  }), [sessions, totalItems]);

  // paginated = sessions (already paginated by backend)
  const paginated = sessions;

  const renderScoreBlocks = (score: number) => {
    const numBlocks = Math.round((score / 100) * 5);
    const colorClass = score < 40 ? 'score-block--red' : score < 70 ? 'score-block--orange' : 'score-block--green';
    return (
      <div className="score-blocks">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className={`score-block ${idx <= numBlocks ? colorClass : 'score-block--gray'}`} />
        ))}
      </div>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={12}
      className={`cl-sort-icon ${sortField === field ? 'cl-sort-icon--active' : ''}`}
    />
  );

  const selectedStatusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'All Status';

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header-row">
        <h1 className="page-title">Candidates</h1>
        <button
          className="btn-secondary"
          onClick={() => exportToCSV(sessions)}
          title="Export filtered candidates to CSV"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="cl-toolbar">
        <div className="cl-toolbar-left">

          {/* Date Range Dropdown */}
          <div ref={dateRef} className="cl-dropdown-wrap">
            <button
              className={`cl-filter-pill ${(dateFrom || dateTo) ? 'cl-filter-pill--active' : ''}`}
              onClick={() => setDateOpen(o => !o)}
            >
              <Calendar size={14} />
              {dateFrom || dateTo
                ? [
                    dateFrom ? new Date(dateFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Start',
                    '→',
                    dateTo ? new Date(dateTo + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'
                  ].join(' ')
                : 'Date Range'
              }
              {(dateFrom || dateTo)
                ? <span className="cl-pill-clear" onClick={(e) => { e.stopPropagation(); setDateFrom(''); setDateTo(''); setCurrentPage(1); }}><X size={12} /></span>
                : <ChevronDown size={14} className={dateOpen ? 'rotated' : ''} />}
            </button>
            {dateOpen && (
              <div className="cl-date-panel">
                <div className="cl-date-panel-header">
                  <Calendar size={13} />
                  <span>Filter by date range</span>
                </div>
                <div className="cl-date-range-row">
                  <div className="cl-date-field">
                    <label className="cl-date-field-label">FROM</label>
                    <input
                      type="date"
                      className="cl-date-input"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <div className="cl-date-range-arrow">→</div>
                  <div className="cl-date-field">
                    <label className="cl-date-field-label">TO</label>
                    <input
                      type="date"
                      className="cl-date-input"
                      value={dateTo}
                      min={dateFrom || undefined}
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <button className="cl-dropdown-clear-btn" onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}>
                    <X size={11} /> Clear range
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div ref={statusRef} className="cl-dropdown-wrap">
            <button className={`cl-filter-pill ${statusFilter !== 'all' ? 'cl-filter-pill--active' : ''}`} onClick={() => setStatusOpen((o) => !o)}>
              {selectedStatusLabel}
              <ChevronDown size={14} className={statusOpen ? 'rotated' : ''} />
            </button>
            {statusOpen && (
              <div className="cl-dropdown-panel">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`cl-dropdown-item ${statusFilter === opt.value ? 'cl-dropdown-item--active' : ''}`}
                    onClick={() => { setStatusFilter(opt.value); setStatusOpen(false); setCurrentPage(1); }}
                  >
                    {opt.label}
                    {statusFilter === opt.value && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="search-field cl-search-field">
            <span className="search-field__icon"><Search size={16} /></span>
            <input
              type="text"
              className="search-field__input cl-search-input"
              placeholder="Filter by test, candidate, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="cl-search-clear" onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="cl-metrics-row">
        <div className="cl-metric">
          <span className="cl-metric-num cl-metric-num--dark">{metrics.total}</span>
          <span className="cl-metric-label">CANDIDATES</span>
        </div>
        <div className="cl-metric">
          <span className="cl-metric-num cl-metric-num--gray">{metrics.inProgress}</span>
          <span className="cl-metric-label">IN PROGRESS</span>
        </div>
        <div className="cl-metric">
          <span className="cl-metric-num cl-metric-num--orange">{metrics.completed}</span>
          <span className="cl-metric-label">COMPLETED</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="cl-table-container">
        <table className="cl-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('test')} className="cl-sortable-th">
                TEST <SortIcon field="test" />
              </th>
              <th onClick={() => handleSort('candidate')} className="cl-sortable-th">
                CANDIDATE <SortIcon field="candidate" />
              </th>
              <th className={`cl-col-right cl-sortable-th`} onClick={() => handleSort('started_at')}>
                STARTED AT <SortIcon field="started_at" />
              </th>
              <th className="cl-col-right cl-sortable-th" onClick={() => handleSort('score')}>
                SCORE <Info size={12} className="cl-info-icon" /> <SortIcon field="score" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="cl-empty-row">
                <td colSpan={4}>
                  <div className="cl-empty-state">
                    <div className="cl-empty-title">Loading candidates...</div>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr className="cl-empty-row">
                <td colSpan={4}>
                  <div className="cl-empty-state">
                    <Users size={40} strokeWidth={1.5} className="cl-empty-icon" />
                    <div className="cl-empty-title">
                      {searchInput || statusFilter !== 'all' || dateFrom
                        ? 'No candidates found'
                        : 'No candidates yet'}
                    </div>
                    <div className="cl-empty-subtitle">
                      {searchInput || statusFilter !== 'all' || dateFrom
                        ? 'Try adjusting your search or filters to find what you are looking for.'
                        : 'When candidates are invited and take tests, they will appear here.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((cand) => (
                <tr
                  key={cand.session_id}
                  className={`cl-table-row clickable-row ${cand.status.toLowerCase() === 'in_progress' || cand.status.toLowerCase() === 'started' ? 'cl-table-row--active' : ''}`}
                  onClick={() => navigate(`/dashboard/candidates/${cand.session_id}`)}
                >
                  <td>
                    <div className="cl-test-name">{cand.assessment_title}</div>
                    <div className="cl-test-date">Created {cand.assessment_created_at}</div>
                  </td>
                  <td>
                    <div className="cl-candidate-cell">
                      <div className="cl-avatar cl-avatar-default">
                        {cand.candidate_name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div className="cl-candidate-info">
                        <div className="cl-candidate-name">
                          <Link to={`/dashboard/candidates/${cand.session_id}`} className="cl-candidate-link" onClick={(e) => e.stopPropagation()}>
                            <span className="cl-name">{cand.candidate_name}</span>
                          </Link>
                          <span className={`cl-status-badge cl-status-badge--${cand.status.toLowerCase()}`}>
                            {(() => {
                              const s = cand.status.toLowerCase();
                              if (s === 'in_progress' || s === 'started') return 'In Progress';
                              if (s === 'completed') return 'Completed';
                              if (s === 'expired') return 'Expired';
                              if (s === 'not_started') return 'Not Started';
                              if (s === 'terminated') return 'Terminated';
                              return cand.status;
                            })()}
                          </span>
                        </div>
                        <div className="cl-candidate-email">{cand.candidate_email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cl-date-cell">
                      <span className="cl-date">
                        {cand.started_at ? new Date(cand.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </span>
                      <span className="cl-time">
                        {cand.started_at ? new Date(cand.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </td>
                  <td className="cl-col-right">
                    <div className="cl-td-stack cl-td-stack--right">
                      <span className={`cl-score ${cand.percentage < 40 ? 'score-low' : cand.percentage < 70 ? 'score-medium' : 'score-high'}`}>
                        {Number(cand.percentage).toFixed(2).replace(/\.00$/, "")}%
                      </span>
                      {renderScoreBlocks(cand.percentage)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="cl-table-footer">
          {totalItems === 0
            ? 'No results'
            : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of ${totalItems} candidates`}
        </div>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
