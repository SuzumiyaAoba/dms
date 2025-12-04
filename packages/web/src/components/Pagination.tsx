'use client';

import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <div
      style={{
        marginTop: '1.5rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      {prevPage ? (
        <Link
          href={`${baseUrl}?page=${prevPage}`}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: 'white',
            color: '#374151',
            textDecoration: 'none',
          }}
        >
          前へ
        </Link>
      ) : (
        <span
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: '#f3f4f6',
            color: '#9ca3af',
          }}
        >
          前へ
        </span>
      )}

      <span style={{ padding: '0.5rem 1rem', color: '#6b7280' }}>
        {currentPage} / {totalPages}
      </span>

      {nextPage ? (
        <Link
          href={`${baseUrl}?page=${nextPage}`}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: 'white',
            color: '#374151',
            textDecoration: 'none',
          }}
        >
          次へ
        </Link>
      ) : (
        <span
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: '#f3f4f6',
            color: '#9ca3af',
          }}
        >
          次へ
        </span>
      )}
    </div>
  );
}
