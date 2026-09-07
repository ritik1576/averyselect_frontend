import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Info, User, ChevronDown, Check, X, Download } from 'lucide-react';
import { Pagination, TableSkeleton } from '../../ui';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { sessionService } from '../../../services/api/session.service';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReviewStatus = 'to_review' | 'passed' | 'rejected';
type TabKey = 'all' | ReviewStatus;

interface Candidate {
  session_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  tag: string;
  has_warning: boolean;
  time_taken_label: string;
  score_label: string;
  score_color: 'green' | 'orange' | 'red' | 'gray';
  review_status: ReviewStatus;
}

interface TabCounts {
  all: number;
  to_review: number;
  passed: number;
  rejected: number;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ReviewStatus, { label: string; pillClass: string; dotClass: string }> = {
  to_review: { label: 'To Review', pillClass: 'status-pill--review',    dotClass: 'status-dot--review' },
  passed:    { label: 'Passed',    pillClass: 'status-pill--passed',    dotClass: 'status-dot--passed' },
  rejected:  { label: 'Rejected',  pillClass: 'status-pill--rejected',  dotClass: 'status-dot--rejected' },
};

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCandidatesCSV(candidates: Candidate[], tabLabel: string) {
  const headers = ['Name', 'Email', 'Tag', 'Time Taken', 'Score', 'Status'];
  const rows = candidates.map((c) => [
    c.candidate_name,
    c.candidate_email,
    c.tag ?? '',
    c.time_taken_label,
    c.score_label,
    c.review_status,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `candidates_${tabLabel.replace(/\s/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Time formatting ──────────────────────────────────────────────────────────
function formatTimeTaken(startedAt: string, completedAt: string, status?: string) {
  // Only show real time for completed sessions
  if (status && status !== 'COMPLETED') return '-';
  if (!startedAt || !completedAt) return '-';
  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (diffMs <= 0) return '-';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tc-icon-inline">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
const UserCheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tc-icon-inline">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
    <polyline points="16 11 18 13 22 9"></polyline>
  </svg>
);
const UserMinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tc-icon-inline">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>
    <line x1="17" y1="11" x2="23" y2="11"></line>
  </svg>
);
const ArrowUpDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tc-icon-arrow">
    <path d="m21 16-4 4-4-4"></path><path d="M17 20V4"></path>
    <path d="m3 8 4-4 4 4"></path><path d="M7 4v16"></path>
  </svg>
);
const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tc-icon-warning">
    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

// ─── Status Dropdown ──────────────────────────────────────────────────────────
interface StatusDropdownProps {
  sessionId: string;
  current: ReviewStatus;
  onChange: (sessionId: string, newStatus: ReviewStatus) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ sessionId, current, onChange }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideWrap = wrapRef.current?.contains(target);
      const isInsideMenu = (target as Element).closest?.('.status-dropdown-menu');
      if (!isInsideWrap && !isInsideMenu) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  const config = STATUS_CONFIG[current];

  return (
    <div ref={wrapRef} className="status-dropdown-wrap" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        className={`status-pill ${config.pillClass}`}
        onClick={handleOpen}
        id={`status-btn-${sessionId}`}
        title="Change status"
      >
        <span className={`status-dot ${config.dotClass}`} />
        {config.label}
        <ChevronDown size={12} className={`status-chevron ${open ? 'rotated' : ''}`} />
      </button>

      {open && (
        <div
          className="status-dropdown-menu"
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
        >
          {(Object.entries(STATUS_CONFIG) as [ReviewStatus, typeof STATUS_CONFIG[ReviewStatus]][]).map(([key, cfg]) => (
            <button
              key={key}
              className={`status-dropdown-item ${current === key ? 'selected' : ''}`}
              onClick={() => { onChange(sessionId, key); setOpen(false); }}
            >
              <span className={`status-dot ${cfg.dotClass}`} />
              {cfg.label}
              {current === key && <Check size={14} className="status-check-icon" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

export const TestCandidatesTable: React.FC = () => {
  const navigate = useNavigate();
  const { id: assessmentId } = useParams<{ id: string }>();

  // ── Server data ──────────────────────────────────────────────────────────────
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [counts, setCounts] = useState<TabCounts>({ all: 0, to_review: 0, passed: 0, rejected: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Debounce search ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // always reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Also reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // ── Fetch (single source of truth) ──────────────────────────────────────────
  const fetchCandidates = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sessionService.getAll({
        assessmentId,
        reviewStatus: activeTab !== 'all' ? activeTab : undefined,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      const mapped: Candidate[] = (res.data as any[]).map((s) => ({
        session_id:        s.session_id,
        candidate_id:      s.candidate_id,
        candidate_name:    s.candidate_name,
        candidate_email:   s.candidate_email,
        tag:               '',
        has_warning:       false,
        time_taken_label:  formatTimeTaken(s.started_at, s.completed_at, s.status),
        score_label:       `${Number(s.percentage ?? 0).toFixed(2).replace(/\.00$/, '')}%`,
        score_color:       (s.percentage >= 70 ? 'green' : s.percentage >= 40 ? 'orange' : 'red') as Candidate['score_color'],
        review_status:     (s.isPassed === true ? 'passed' : s.isPassed === false ? 'rejected' : 'to_review') as ReviewStatus,
      }));

      setCandidates(mapped);

      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        // counts come back from the backend always based on the full assessmentId scope (not the filtered tab)
        if (res.meta.counts) {
          setCounts({
            all:       res.meta.counts.all       || 0,
            to_review: res.meta.counts.to_review || 0,
            passed:    res.meta.counts.passed    || 0,
            rejected:  res.meta.counts.rejected  || 0,
          });
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch candidates');
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [assessmentId, activeTab, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // ── Status change ─────────────────────────────────────────────────────────────
  const handleStatusChange = async (sessionId: string, newStatus: ReviewStatus) => {
    const previousStatus = candidates.find((c) => c.session_id === sessionId)?.review_status;
    if (!previousStatus || previousStatus === newStatus) return;

    // Optimistic UI: update local row immediately
    setCandidates((prev) =>
      prev.map((c) => c.session_id === sessionId ? { ...c, review_status: newStatus } : c)
    );

    try {
      const isPassed = newStatus === 'passed' ? true : newStatus === 'rejected' ? false : null;
      await sessionService.updateReviewStatus(sessionId, isPassed);
      toast.success('Status updated');

      // After a successful update, re-fetch so counts + pagination are accurate
      // (slight delay to give the user a moment to see the optimistic change)
      setTimeout(() => fetchCandidates(), 300);
    } catch (err) {
      toast.error('Failed to update status');
      // Roll back optimistic change
      setCandidates((prev) =>
        prev.map((c) => c.session_id === sessionId ? { ...c, review_status: previousStatus } : c)
      );
    }
  };

  // ── Tab definitions ───────────────────────────────────────────────────────────
  const TABS: { key: TabKey; label: string; icon: React.ReactNode; hasDot?: boolean }[] = [
    { key: 'all',       label: `All (${counts.all})`,             icon: <UsersIcon /> },
    { key: 'to_review', label: `To review (${counts.to_review})`, icon: <UserCheckIcon />, hasDot: counts.to_review > 0 },
    { key: 'rejected',  label: `Rejected (${counts.rejected})`,   icon: <UserMinusIcon /> },
    { key: 'passed',    label: `Passed (${counts.passed})`,       icon: <UserCheckIcon /> },
  ];

  // Footer: correct total for current tab
  const tabTotal = counts[activeTab] ?? candidates.length;
  const showingFrom = candidates.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const showingTo   = showingFrom + candidates.length - 1;

  const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label ?? '';

  return (
    <div className="test-detail-candidates">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="tc-toolbar">
        <div className="tc-filters">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              className={`tc-pill ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
              {tab.hasDot && <span className="red-dot" />}
            </button>
          ))}
        </div>

        <div className="tc-actions">
          <div className="tc-search">
            <Search size={16} className="tc-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="tc-search-clear" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <button className="tc-filter-btn">
            <SlidersHorizontal size={16} />
          </button>
          <button
            className="tc-export-btn"
            title="Export to CSV"
            onClick={() => exportCandidatesCSV(candidates, activeTabLabel)}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {isInitialLoading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#ef4444', padding: '2rem' }}>{error}</div>
      ) : (
        <>
          {/* ── Table ─────────────────────────────────────────────── */}
          <div className="tc-table-container">
            <table className="tc-table">
              <thead>
                <tr>
                  <th className="tc-col-candidate"><UsersIcon /> Candidates <ArrowUpDownIcon /></th>
                  <th className="tc-col-status">Status</th>
                  <th>Time Taken <ArrowUpDownIcon /></th>
                  <th>Score <Info size={12} className="tc-icon-info" /> <ArrowUpDownIcon /></th>
                </tr>
              </thead>
              <tbody className="page-fade-in">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="tc-empty-state">
                      {debouncedSearch
                        ? `No candidates matching "${debouncedSearch}"`
                        : `No candidates in "${activeTabLabel}" yet.`}
                    </td>
                  </tr>
                ) : (
                  candidates.map((cand) => (
                    <tr
                      key={cand.session_id}
                      className="tc-clickable-row"
                      onClick={() => navigate(`/dashboard/candidates/${cand.session_id}`)}
                    >
                      <td>
                        <div className="tc-candidate-cell">
                          <div className="tc-avatar-group">
                            <div className="tc-avatar">
                              <User size={14} color="#64748b" />
                            </div>
                            <div className="tc-avatar-chevron">
                              <ChevronDown size={8} />
                            </div>
                          </div>
                          <div className="tc-candidate-info">
                            <div className="tc-name-row">
                              <Link
                                to={`/dashboard/candidates/${cand.session_id}`}
                                className="tc-name tc-candidate-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cand.candidate_name}
                              </Link>
                              {cand.tag && <span className="tc-tag">{cand.tag}</span>}
                              {cand.has_warning && <WarningIcon />}
                            </div>
                            <span className="tc-email">{cand.candidate_email}</span>
                          </div>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <StatusDropdown
                          sessionId={cand.session_id}
                          current={cand.review_status}
                          onChange={handleStatusChange}
                        />
                      </td>
                      <td><span className="tc-text-neutral">{cand.time_taken_label}</span></td>
                      <td><span className={`tc-score tc-${cand.score_color}`}>{cand.score_label}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ── Footer: Showing X–Y of Z ─── */}
            {candidates.length > 0 && (
              <div className="tc-table-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Showing {showingFrom}–{showingTo} of {tabTotal} candidates
                </span>
              </div>
            )}
          </div>

          {/* ── Pagination (only when multiple pages) ─── */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
};
