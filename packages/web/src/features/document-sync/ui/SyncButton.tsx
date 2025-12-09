'use client';

import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '@/shared/api';

interface SyncButtonProps {
  directories: string[];
  onSyncComplete?: (directories: string[]) => void;
}

export function SyncButton({ directories, onSyncComplete }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);

    try {
      const result = await apiClient.syncDocuments(directories);
      setMessage({
        type: 'success',
        text: `同期完了: ${result.added}件追加、${result.removed}件削除（${result.directories.length}件のディレクトリを対象）`,
      });

      // Notify parent component
      if (onSyncComplete) {
        onSyncComplete(result.directories);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '同期に失敗しました',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        type="button"
        title="ストレージと再同期"
        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:bg-muted-foreground disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>{isSyncing ? '同期中...' : 'ストレージと再同期'}</span>
      </button>

      {message && (
        <div
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
