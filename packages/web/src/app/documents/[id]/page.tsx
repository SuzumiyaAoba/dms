import Link from 'next/link';
import { DeleteButton } from '@/components/DeleteButton';
import { apiClient } from '@/lib/api-client';
import type { Document } from '@/types/api';

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusBadgeStyle(status: Document['status']) {
  const baseStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'inline-block',
  };

  switch (status) {
    case 'ready':
      return { ...baseStyle, background: '#10b981', color: 'white' };
    case 'processing':
      return { ...baseStyle, background: '#f59e0b', color: 'white' };
    case 'error':
      return { ...baseStyle, background: '#ef4444', color: 'white' };
  }
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params;

  let document: Document | null = null;
  let error: string | null = null;

  try {
    document = await apiClient.getDocument(id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
        <Link
          href="/documents"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
          }}
        >
          ← ドキュメント一覧に戻る
        </Link>
      </div>
    );
  }

  if (!document) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <p>ドキュメントが見つかりません</p>
        <Link
          href="/documents"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
          }}
        >
          ← ドキュメント一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/documents"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          ← ドキュメント一覧に戻る
        </Link>
      </div>

      {/* Title and Status */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{document.title}</h1>
          <span style={getStatusBadgeStyle(document.status)}>{document.status}</span>
        </div>
        {document.description && (
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>{document.description}</p>
        )}
      </div>

      {/* Tags */}
      {document.tags.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>タグ</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {document.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: '#dbeafe',
                  color: '#1e40af',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File Information */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          ファイル情報
        </h2>
        <dl style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem' }}>
          <dt style={{ color: '#6b7280', fontWeight: '500' }}>ファイル名:</dt>
          <dd>{document.fileName}</dd>

          <dt style={{ color: '#6b7280', fontWeight: '500' }}>ファイルサイズ:</dt>
          <dd>{formatFileSize(document.fileSize)}</dd>

          <dt style={{ color: '#6b7280', fontWeight: '500' }}>MIME Type:</dt>
          <dd>{document.mimeType}</dd>

          <dt style={{ color: '#6b7280', fontWeight: '500' }}>ファイルURL:</dt>
          <dd style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {document.fileUrl}
          </dd>
        </dl>
      </div>

      {/* Document Information */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          ドキュメント情報
        </h2>
        <dl style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem' }}>
          <dt style={{ color: '#6b7280', fontWeight: '500' }}>ID:</dt>
          <dd style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{document.id}</dd>

          <dt style={{ color: '#6b7280', fontWeight: '500' }}>作成日時:</dt>
          <dd>{formatDate(document.createdAt)}</dd>

          <dt style={{ color: '#6b7280', fontWeight: '500' }}>更新日時:</dt>
          <dd>{formatDate(document.updatedAt)}</dd>

          {document.extractedText && (
            <>
              <dt style={{ color: '#6b7280', fontWeight: '500' }}>抽出テキスト:</dt>
              <dd
                style={{
                  whiteSpace: 'pre-wrap',
                  background: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                {document.extractedText}
              </dd>
            </>
          )}

          {document.embeddingId && (
            <>
              <dt style={{ color: '#6b7280', fontWeight: '500' }}>Embedding ID:</dt>
              <dd style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {document.embeddingId}
              </dd>
            </>
          )}
        </dl>
      </div>

      {/* Metadata */}
      {Object.keys(document.metadata).length > 0 && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            カスタムメタデータ
          </h2>
          <pre
            style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(document.metadata, null, 2)}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <DeleteButton documentId={document.id} />
      </div>
    </div>
  );
}
