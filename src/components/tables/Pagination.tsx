import React from 'react';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages: (number | 'ellipsis')[] = [0];

  if (current > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 4) {
    pages.push('ellipsis');
  }

  pages.push(total - 1);

  return pages;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, totalElements, pageSize, onPageChange, onPageSizeChange }) => {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="pagination">
      <div className="pagination-top">
        <div className="pagination-size">
          <label htmlFor="page-size-select">Itens por página:</label>
          <select
            id="page-size-select"
            className="pagination-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <span className="pagination-info">
          Página {page + 1} de {totalPages} ({totalElements} registros)
        </span>
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn--small btn--secondary"
          disabled={page === 0}
          onClick={() => onPageChange(0)}
          title="Primeira página"
        >
          &laquo;
        </button>
        <button
          className="btn btn--small btn--secondary"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">...</span>
          ) : (
            <button
              key={p}
              className={`btn btn--small ${p === page ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          )
        )}

        <button
          className="btn btn--small btn--secondary"
          disabled={page === totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </button>
        <button
          className="btn btn--small btn--secondary"
          disabled={page === totalPages - 1}
          onClick={() => onPageChange(totalPages - 1)}
          title="Última página"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
};

export default Pagination;
