'use client';

import { useRouter } from 'next/navigation';
import { DocumentList } from '@/entities/document';
import { SyncButton } from '@/features/document-sync';
import type { Document } from '@/shared/model';
import { Pagination } from '@/shared/ui';

interface DocumentsPageClientProps {
  documents: {
    items: Document[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | null;
  error: string | null;
  page: number;
}

export function DocumentsPageClient({ documents, error, page }: DocumentsPageClientProps) {
  const router = useRouter();

  const handleSyncComplete = () => {
    // Refresh the page to show updated document list
    router.refresh();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            ドキュメント一覧
          </h1>
          {documents && (
            <p style={{ color: '#6b7280' }}>
              全 {documents.pagination.total} 件のドキュメント（{page} /{' '}
              {documents.pagination.totalPages} ページ）
            </p>
          )}
        </div>
        <SyncButton directories={[]} onSyncComplete={() => handleSyncComplete()} />
      </div>

      {error ? (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <strong>エラー:</strong> {error}
        </div>
      ) : documents ? (
        <>
          <DocumentList documents={documents.items} />
          <Pagination
            currentPage={page}
            totalPages={documents.pagination.totalPages}
            baseUrl="/documents"
          />
        </>
      ) : null}
    </div>
  );
}
