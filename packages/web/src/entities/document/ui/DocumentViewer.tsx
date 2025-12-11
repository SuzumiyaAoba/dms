'use client';

import { FileText } from 'lucide-react';
import * as React from 'react';
import { apiClient } from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import type { Document } from '@/shared/model';
import { TableOfContents } from '@/widgets/table-of-contents';
import { CollapsedProvider } from './CollapsedContext';
import { MarkdownPreview } from './MarkdownPreview';
import { OrgPreview } from './OrgPreview';

interface DocumentViewerProps {
  document: Document | null;
  className?: string;
}

type ViewTab = 'preview' | 'raw';

export function DocumentViewer({ document, className }: DocumentViewerProps) {
  const [content, setContent] = React.useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = React.useState(false);
  const [showContentLoading, setShowContentLoading] = React.useState(false);
  const [contentError, setContentError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<ViewTab>('preview');
  const contentLoadingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Helper to determine if file is org-mode
  const isOrgFile = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.org');
  };
  // Helper to determine if file is markdown
  const isMarkdownFile = (fileName: string): boolean => {
    const lower = fileName.toLowerCase();
    return lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.mdown');
  };

  React.useEffect(() => {
    if (!document) {
      setContent('');
      return;
    }

    setIsLoadingContent(true);
    setShowContentLoading(false);
    if (contentLoadingTimerRef.current) {
      clearTimeout(contentLoadingTimerRef.current);
    }
    contentLoadingTimerRef.current = setTimeout(() => {
      setShowContentLoading(true);
    }, 200);
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
        if (contentLoadingTimerRef.current) {
          clearTimeout(contentLoadingTimerRef.current);
          contentLoadingTimerRef.current = null;
        }
        setShowContentLoading(false);
      });
  }, [document]);
  React.useEffect(() => {
    return () => {
      if (contentLoadingTimerRef.current) {
        clearTimeout(contentLoadingTimerRef.current);
      }
    };
  }, []);

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
    <CollapsedProvider>
      <div className={cn('h-full flex overflow-hidden', className)}>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Section - Fixed */}
          <div className="border-b border-border pb-6 mb-6 flex-shrink-0">
            <h1 className="text-3xl font-semibold tracking-tight mb-3">{document.title}</h1>
            {document.description && (
              <p className="text-muted-foreground text-base leading-relaxed">
                {document.description}
              </p>
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

          {/* Tab Switcher */}
          <div className="border-b border-border flex-shrink-0">
            <div className="flex gap-1 px-4">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'preview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                プレビュー
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'raw'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                Raw
              </button>
            </div>
          </div>

          {/* Content Section - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingContent && showContentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">読み込み中...</div>
              </div>
            ) : contentError ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-destructive">{contentError}</div>
              </div>
            ) : content ? (
              <div>
                {activeTab === 'preview' ? (
                  document && isOrgFile(document.fileName) ? (
                    <OrgPreview content={content} className="p-8" />
                  ) : document && isMarkdownFile(document.fileName) ? (
                    <MarkdownPreview content={content} className="p-8" />
                  ) : (
                    <div className="overflow-hidden">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono p-8 overflow-x-auto">
                        {content}
                      </pre>
                    </div>
                  )
                ) : (
                  <div className="overflow-hidden">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono p-8 overflow-x-auto">
                      {content}
                    </pre>
                  </div>
                )}
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

        {/* Table of Contents - Right Sidebar */}
        {activeTab === 'preview' && content && (
          <div className="w-64 border-l border-border overflow-y-auto px-6 py-6 flex-shrink-0">
            <TableOfContents content={content} />
          </div>
        )}
      </div>
    </CollapsedProvider>
  );
}
