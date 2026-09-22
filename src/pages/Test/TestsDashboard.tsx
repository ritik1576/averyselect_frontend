import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks';
import { Search, ArrowUpDown, Users, X, AlertCircle, FileText, MoreVertical, Copy, Trash2, Archive, Edit, Eye, Globe, EyeOff } from 'lucide-react';
import { 
  fetchAssessmentsRequest,
  deleteAssessmentRequest,
  archiveAssessmentRequest,
  duplicateAssessmentRequest,
  updateAssessmentRequest
} from '../../store/slices/assessmentSlice';
import { Pagination, TableSkeleton, Modal } from '../../components/ui';
import './TestsDashboard.css';

type SortField = 'title' | 'candidates' | 'updated_at';
type SortDir = 'asc' | 'desc';
type ListStatus = 'ACTIVE' | 'ARCHIVED';

export const TestsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tests, totalItems, loading, error } = useAppSelector((state) => state.assessment);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [listStatus, setListStatus] = useState<ListStatus>('ACTIVE');
  const itemsPerPage = 5;

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Modals state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  // Close menus when clicking outside
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchAssessmentsRequest({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        sortBy: sortField,
        sortDir: sortDir,
        status: listStatus
      }));
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, currentPage, searchQuery, sortField, sortDir, listStatus]);


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  const handleDeleteConfirm = () => {
    if (selectedTest) {
      dispatch(deleteAssessmentRequest(selectedTest.id));
      setIsDeleteModalOpen(false);
      setSelectedTest(null);
    }
  };

  const handleArchiveConfirm = () => {
    if (selectedTest) {
      dispatch(archiveAssessmentRequest(selectedTest.id));
      setIsArchiveModalOpen(false);
      setSelectedTest(null);
    }
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
              placeholder="Search tests..."
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

      {/* Tabs */}
      <div className="tsd-tabs">
        <button 
          className={`tsd-tab ${listStatus === 'ACTIVE' ? 'tsd-tab--active' : ''}`}
          onClick={() => { setListStatus('ACTIVE'); setCurrentPage(1); }}
        >
          Active Tests
        </button>
        <button 
          className={`tsd-tab ${listStatus === 'ARCHIVED' ? 'tsd-tab--active' : ''}`}
          onClick={() => { setListStatus('ARCHIVED'); setCurrentPage(1); }}
        >
          Archived Tests
        </button>
      </div>

      {/* Table */}
      <div className="tsd-table-container">
        <table className="tsd-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }} className="tsd-sortable-th" onClick={() => handleSort('title')}>
                TEST NAME <SortIcon field="title" />
              </th>
              <th style={{ width: '10%' }}>STATUS</th>
              <th style={{ width: '10%' }} className="d-col-center">QUESTIONS</th>
              <th style={{ width: '15%' }} className="d-col-center tsd-sortable-th" onClick={() => handleSort('candidates')}>
                CANDIDATES <SortIcon field="candidates" />
              </th>
              <th style={{ width: '15%' }}>DURATION</th>
              <th style={{ width: '15%' }} className="tsd-sortable-th" onClick={() => handleSort('updated_at')}>
                LAST UPDATED <SortIcon field="updated_at" />
              </th>
              <th style={{ width: '10%' }} className="d-col-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {(loading && tests.length === 0) ? (
              <TableSkeleton columns={7} rows={5} />
            ) : error ? (
              <tr className="tsd-empty-row">
                <td colSpan={7}>
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
                        sortDir: sortDir,
                        status: listStatus
                      }))}
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : paginatedTests.length === 0 ? (
              <tr className="tsd-empty-row">
                <td colSpan={7}>
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
              paginatedTests.map((test: any) => {
                
                const isArchived = !!test.deletedAt;
                const isPublished = test.isPublished;
                const isDraft = !isArchived && !isPublished;
                const hasCandidateActivity = test.hasCandidateActivity;

                let statusBadge = null;
                if (isArchived) {
                  statusBadge = <span className="tsd-tag" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>Archived</span>;
                } else if (isPublished) {
                  statusBadge = <span className="tsd-tag" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Published</span>;
                } else {
                  statusBadge = <span className="tsd-tag" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>Draft</span>;
                }

                return (
                <tr key={test.id}>
                  <td>
                    <Link to={`/dashboard/tests/detail/${test.id}`} className="tsd-test-link" style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                      {test.title}
                    </Link>
                  </td>
                  <td>{statusBadge}</td>
                  <td className="d-col-center">
                    {test._count?.questions || 0}
                  </td>
                  <td className="d-col-center">
                    <div 
                      className="dashboard-test-meta-item" 
                      style={{ justifyContent: 'center', cursor: 'pointer', color: 'var(--color-primary)' }}
                      onClick={() => navigate(`/dashboard/candidates?assessmentId=${test.id}`)}
                      title="View candidates"
                    >
                      <Users size={16} />
                      <span style={{ textDecoration: 'underline' }}>{test.candidate_count || 0}</span>
                    </div>
                  </td>
                  <td>
                    {test.durationMinutes ? `${test.durationMinutes} min` : '-'}
                  </td>
                  <td>
                    {new Date(test.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || '-'}
                  </td>
                  <td className="d-col-center" style={{ position: 'relative' }}>
                    <button 
                      className="tsd-action-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === test.id ? null : test.id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenuId === test.id && (
                      <div ref={menuRef} className="tsd-dropdown-menu">
                        <button className="tsd-dropdown-item" onClick={() => navigate(`/dashboard/tests/detail/${test.id}`)}>
                          <Eye size={14} /> View
                        </button>
                        {!isArchived && (
                          <button className="tsd-dropdown-item" onClick={() => navigate(`/dashboard/tests/detail/${test.id}`)}>
                            <Edit size={14} /> Edit
                          </button>
                        )}
                        <button className="tsd-dropdown-item" onClick={() => {
                          dispatch(duplicateAssessmentRequest(test.id));
                          setActiveMenuId(null);
                        }}>
                          <Copy size={14} /> Duplicate
                        </button>
                        
                        {!isArchived && isDraft && (
                          <button className="tsd-dropdown-item" onClick={() => {
                            dispatch(updateAssessmentRequest({ id: test.id, data: { isPublished: true } }));
                            setActiveMenuId(null);
                          }}>
                            <Globe size={14} /> Publish
                          </button>
                        )}

                        {!isArchived && isPublished && (
                          <button className="tsd-dropdown-item" onClick={() => {
                            dispatch(updateAssessmentRequest({ id: test.id, data: { isPublished: false } }));
                            setActiveMenuId(null);
                          }}>
                            <EyeOff size={14} /> Unpublish
                          </button>
                        )}

                        {!isArchived && (isPublished || hasCandidateActivity) && (
                          <button className="tsd-dropdown-item" onClick={() => {
                            setSelectedTest(test);
                            setIsArchiveModalOpen(true);
                            setActiveMenuId(null);
                          }}>
                            <Archive size={14} /> Archive
                          </button>
                        )}

                        {!isArchived && isDraft && !hasCandidateActivity && (
                          <button className="tsd-dropdown-item tsd-dropdown-item--danger" onClick={() => {
                            setSelectedTest(test);
                            setIsDeleteModalOpen(true);
                            setActiveMenuId(null);
                          }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                );
              })
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Test"
      >
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '20px' }}>
            Are you sure you want to delete <strong>"{selectedTest?.title}"</strong>?<br /><br />
            This test is a draft and has no candidate activity. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn-primary" style={{ backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)' }} onClick={handleDeleteConfirm}>Delete Test</button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        title="Archive Test"
      >
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '20px' }}>
            Are you sure you want to archive <strong>"{selectedTest?.title}"</strong>?<br /><br />
            Candidates and historical results will be preserved, but this test will no longer appear in Active Tests.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setIsArchiveModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleArchiveConfirm}>Archive Test</button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
