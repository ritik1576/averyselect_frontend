import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button
            key={i}
            className={`ui-page-btn ${currentPage === i ? 'ui-page-btn--active' : ''}`}
            onClick={() => onPageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      // Always show first page
      pages.push(
        <button
          key={1}
          className={`ui-page-btn ${currentPage === 1 ? 'ui-page-btn--active' : ''}`}
          onClick={() => onPageChange(1)}
        >
          1
        </button>
      );

      // Logic for ellipsis and middle pages
      if (currentPage > 3) {
        pages.push(<span key="ell-1" className="ui-page-ellipsis">...</span>);
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            className={`ui-page-btn ${currentPage === i ? 'ui-page-btn--active' : ''}`}
            onClick={() => onPageChange(i)}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 2) {
        pages.push(<span key="ell-2" className="ui-page-ellipsis">...</span>);
      }

      // Always show last page
      pages.push(
        <button
          key={totalPages}
          className={`ui-page-btn ${currentPage === totalPages ? 'ui-page-btn--active' : ''}`}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="ui-pagination">
      <button 
        className="ui-page-btn" 
        onClick={handlePrev} 
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      
      {renderPageNumbers()}

      <button 
        className="ui-page-btn" 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
