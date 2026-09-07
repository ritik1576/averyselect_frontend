import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import { Search, ArrowUpDown, Users, X, AlertCircle, FileText } from 'lucide-react';
import { fetchAssessmentsRequest } from '../../store/slices/assessmentSlice';
import { Pagination, TableSkeleton } from '../../components/ui';
import './TestsDashboard.css';

type SortField = 'title' | 'candidates' | 'updated_at';
type SortDir = 'asc' | 'desc';

export const TestsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tests, totalItems, loading, error } = useAppSelector((state) => state.assessment);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const itemsPerPage = 5;

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchAssessmentsRequest({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        sortBy: sortField,
        sortDir: sortDir
      }));
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, currentPage, searchQuery, sortField, sortDir]);


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const paginatedTests = tests;


  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={12}
      className={`tsd-sort-icon ${sortField === field ? 'tsd-sort-icon--active' : ''}`}
    />
  );

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header-row">
        <h1 className="page-title">Tests</h1>
        <div className="tsd-header-actions">
          {/* Search */}
          <div className="search-field tsd-search">
            <span className="search-field__icon"><Search size={18} /></span>
            <input
              type="text"
              className="search-field__input d-search-input"
              placeholder="Search by test name or domain..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            {searchQuery && (
              <button className="tsd-search-clear" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button className="btn-primary" onClick={() => navigate('/dashboard/tests/create')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            New Test
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="tsd-table-container">
        <table className="tsd-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }} className="tsd-sortable-th" onClick={() => handleSort('title')}>
                TEST NAME <SortIcon field="title" />
              </th>
              <th style={{ width: '30%' }} className="d-col-center tsd-sortable-th" onClick={() => handleSort('candidates')}>
                CANDIDATES <SortIcon field="candidates" />
              </th>
              <th style={{ width: '30%' }} className="d-col-center">DOMAINS</th>
            </tr>
          </thead>
          <tbody>
            {(loading && tests.length === 0) ? (
              <TableSkeleton columns={3} rows={5} />
            ) : error ? (
              <tr className="tsd-empty-row">
                <td colSpan={3}>
                  <div className="tsd-empty-state">
                    <AlertCircle size={40} strokeWidth={1.5} className="tsd-empty-icon" style={{ color: 'var(--color-error)', opacity: 1 }} />
                    <div className="tsd-empty-title" style={{ color: 'var(--color-error)' }}>Failed to load tests</div>
                    <div className="tsd-empty-subtitle" style={{ marginBottom: '16px' }}>Please check your connection and try again.</div>
                    <button 
                      className="btn-secondary" 
                      onClick={() => dispatch(fetchAssessmentsRequest({
                        page: currentPage,
                        limit: itemsPerPage,
                        search: searchQuery,
                        sortBy: sortField,
                        sortDir: sortDir
                      }))}
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : paginatedTests.length === 0 ? (
              <tr className="tsd-empty-row">
                <td colSpan={3}>
                  <div className="tsd-empty-state">
                    <FileText size={40} strokeWidth={1.5} className="tsd-empty-icon" />
                    <div className="tsd-empty-title">
                      {searchQuery ? 'No tests found' : 'No tests yet'}
                    </div>
                    <div className="tsd-empty-subtitle">
                      {searchQuery
                        ? 'Try adjusting your search to find what you are looking for.'
                        : 'Create your first test to get started!'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTests.map((test) => (
                <tr key={test.id}>
                  <td>
                    <Link to={`/dashboard/tests/detail/${test.id}`} className="tsd-test-link">
                      {test.title}
                    </Link>
                  </td>
                  <td className="d-col-center">
                    <div className="dashboard-test-meta-item" style={{ justifyContent: 'center' }}>
                      <Users size={16} />
                      <span>{(test as any).candidate_count || 0} candidates</span>
                    </div>
                  </td>
                  <td className="d-col-center">
                    {(!(test as any).domain_tags || (test as any).domain_tags.length === 0) ? (
                      <span className="tsd-empty-cell" style={{ color: 'var(--color-neutral-light)' }}>-</span>
                    ) : (
                      <div className="tsd-tags-row" style={{ justifyContent: 'center' }}>
                        {(test as any).domain_tags.map((skill: string, i: number) => {
                          const highlight = skill.startsWith('+') || skill === 'JS' || skill === 'C++' || skill === '.NET';
                          return (
                            <span key={i} className={`tsd-tag ${highlight ? 'tsd-tag--highlight' : 'tsd-tag--normal'}`}>
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="tsd-table-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {totalItems === 0
              ? 'No results'
              : `Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} tests`}
          </span>
          <div className="pagination-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '12px' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              className="btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '12px' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
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
