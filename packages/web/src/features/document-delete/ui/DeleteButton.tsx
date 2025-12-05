'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiClientError, apiClient } from '@/shared/api';

interface DeleteButtonProps {
  documentId: string;
}

export function DeleteButton({ documentId }: DeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('このドキュメントを削除してもよろしいですか？')) {
      return;
    }

    setDeleting(true);
    try {
      await apiClient.deleteDocument(documentId);
      alert('ドキュメントを削除しました');
      router.push('/documents');
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(`削除に失敗しました: ${err.message}`);
      } else {
        alert(`削除に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      style={{
        padding: '0.75rem 1.5rem',
        background: deleting ? '#9ca3af' : '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '0.375rem',
        fontWeight: '500',
        cursor: deleting ? 'not-allowed' : 'pointer',
      }}
    >
      {deleting ? '削除中...' : 'ドキュメントを削除'}
    </button>
  );
}
