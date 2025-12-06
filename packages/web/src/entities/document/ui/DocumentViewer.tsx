'use client';

import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/shared/api/api-client';
import { cn } from '@/shared/lib/utils';
import type { Document } from '@/shared/model/document';

interface DocumentViewerProps {
  document: Document | null;
  className?: string;
}

export function DocumentViewer({ document, className }: DocumentViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (!document) {
      setContent('');
      return;
    }

    setIsLoadingContent(true);
    setContentError(null);

    apiClient
      .getDocumentContent(document.id)
      .then((fileContent) => {
        setContent(fileContent);
      })
      .catch((error) => {
        console.error('Failed to load document content:', error);
        setContentError('ファイル内容の読み込みに失敗しました');
      })
      .finally(() => {
        setIsLoadingContent(false);
      });
  }, [document]);

  if (!document) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center h-full text-muted-foreground',
          className,
        )}
      >
        <FileText className="h-16 w-16 mb-4" />
        <p className="text-lg">ドキュメントを選択してください</p>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col overflow-hidden', className)}>
      {/* Header Section - Fixed */}
      <div className="border-b border-border pb-6 mb-6 flex-shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">{document.title}</h1>
        {document.description && (
          <p className="text-muted-foreground text-base leading-relaxed">{document.description}</p>
        )}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {document.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-6 text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">ファイル:</span>
            <span>{document.fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">サイズ:</span>
            <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      </div>

      {/* Content Section - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingContent ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">読み込み中...</div>
          </div>
        ) : contentError ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">{contentError}</div>
          </div>
        ) : content ? (
          <div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono p-8 overflow-x-auto">
                {content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">このドキュメントには内容がありません</div>
          </div>
        )}

        {Object.keys(document.metadata).length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">メタデータ</h2>
            <div className="bg-card border border-border rounded-lg p-4">
              <pre className="text-sm text-muted-foreground overflow-x-auto">
                {JSON.stringify(document.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
