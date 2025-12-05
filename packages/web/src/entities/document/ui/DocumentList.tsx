'use client';

import Link from 'next/link';
import type { Document } from '@/shared/model';

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadgeStyle = (status: Document['status']) => {
    const baseStyle = {
      padding: '0.25rem 0.75rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
    };

    switch (status) {
      case 'ready':
        return { ...baseStyle, background: '#10b981', color: 'white' };
      case 'processing':
        return { ...baseStyle, background: '#f59e0b', color: 'white' };
      case 'error':
        return { ...baseStyle, background: '#ef4444', color: 'white' };
    }
  };

  if (documents.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '4rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          color: '#6b7280',
        }}
      >
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>ドキュメントがありません</p>
        <p>新しいドキュメントをアップロードしてください</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <tr>
            <th
              style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              タイトル
            </th>
            <th
              style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              ファイル
            </th>
            <th
              style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              サイズ
            </th>
            <th
              style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              ステータス
            </th>
            <th
              style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              作成日時
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              style={{
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <td style={{ padding: '1rem' }}>
                <Link
                  href={`/documents/${doc.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ fontWeight: '500', color: '#111827', marginBottom: '0.25rem' }}>
                    {doc.title}
                  </div>
                  {doc.description && (
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '300px',
                      }}
                    >
                      {doc.description}
                    </div>
                  )}
                  {doc.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </td>
              <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                {doc.fileName}
              </td>
              <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                {formatFileSize(doc.fileSize)}
              </td>
              <td style={{ padding: '1rem' }}>
                <span style={getStatusBadgeStyle(doc.status)}>{doc.status}</span>
              </td>
              <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                {formatDate(doc.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
