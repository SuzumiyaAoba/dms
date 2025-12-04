import { DocumentList } from '@/components/DocumentList';
import { Pagination } from '@/components/Pagination';
import * as apiServer from '@/lib/api-server';

interface DocumentsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = await searchParams;
  const page = Number.parseInt(params.page || '1', 10);
  const limit = 20;

  let documents: Awaited<ReturnType<typeof apiServer.listDocuments>> | null = null;
  let error: string | null = null;

  try {
    documents = await apiServer.listDocuments(page, limit);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
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
