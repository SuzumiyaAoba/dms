'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SyncButton } from '@/features/document-sync';
import { useSyncDirectories } from '@/shared/providers/sync-directories';

export default function SettingsPage() {
  const {
    directories,
    effectiveDirectories,
    addDirectory,
    removeDirectory,
    resetToDefault,
    setDirectories,
  } = useSyncDirectories();
  const [directoryInput, setDirectoryInput] = useState('');

  const handleAddDirectory = () => {
    if (!directoryInput.trim()) return;
    addDirectory(directoryInput);
    setDirectoryInput('');
  };

  const handleDirectoryInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddDirectory();
    }
  };

  const handleSyncComplete = (dirs: string[]) => {
    if (dirs.length > 0) {
      setDirectories(dirs);
    }
  };

  const isUsingDefault = directories.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">設定</p>
            <h1 className="text-3xl font-bold">同期対象ディレクトリ</h1>
            <p className="text-sm text-muted-foreground">
              DMS
              が監視・同期するルートディレクトリを管理します。未指定の場合は既定のパスを使用します。
            </p>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            ← ドキュメントに戻る
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-lg border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">対象ディレクトリ</h2>
                <p className="text-sm text-muted-foreground">
                  1行ずつ追加してください（~/path 形式も可）。重複は無視されます。
                </p>
              </div>
              <button
                type="button"
                onClick={resetToDefault}
                className="text-xs text-muted-foreground underline decoration-dotted hover:text-foreground"
              >
                既定に戻す
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="~/zettelkasten や /Users/you/notes"
                value={directoryInput}
                onChange={(e) => setDirectoryInput(e.target.value)}
                onKeyDown={handleDirectoryInputKeyDown}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddDirectory}
                className="px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                追加
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                現在の有効な対象:
                <span className="ml-1 font-medium text-foreground">
                  {effectiveDirectories.join(', ')}
                </span>
                {isUsingDefault && '（既定を使用中）'}
              </p>
              <div className="flex flex-wrap gap-2">
                {directories.length > 0 ? (
                  directories.map((dir) => (
                    <span
                      key={dir}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1 text-xs"
                    >
                      <span className="max-w-[240px] truncate" title={dir}>
                        {dir}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDirectory(dir)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`${dir} を削除`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    ディレクトリを追加していないため、既定のパスを使用します。
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">ストレージと再同期</h2>
              <p className="text-sm text-muted-foreground">
                現在の対象ディレクトリでメタデータを更新します。
              </p>
            </div>
            <SyncButton directories={effectiveDirectories} onSyncComplete={handleSyncComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}
