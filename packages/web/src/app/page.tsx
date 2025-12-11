'use client';

import { Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { DocumentViewer } from '@/entities/document';
import { apiClient } from '@/shared/api';
import { buildDirectoryTree, type TreeNode } from '@/shared/lib/directory-tree';
import type { Document } from '@/shared/model';
import { useSyncDirectories } from '@/shared/providers/sync-directories';
import { DirectoryTree } from '@/widgets/directory-tree';
import { DocumentLayout } from '@/widgets/document-layout';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { effectiveDirectories } = useSyncDirectories();
  const loadingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load documents function
  const loadDocuments = React.useCallback(() => {
    setIsLoading(true);
    setShowLoading(false);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => {
      setShowLoading(true);
    }, 200);
    const startedAt = performance.now();
    // Debug: log when the initial list API responds
    apiClient
      .listDocuments(1, 100)
      .then((response) => {
        setDocuments(response.items);
        const duration = Math.round(performance.now() - startedAt);
        // eslint-disable-next-line no-console
        console.log(
          `[dms-debug] listDocuments completed at ${new Date().toISOString()} (${duration}ms)`,
        );
      })
      .catch((error) => {
        console.error('Failed to load documents:', error);
      })
      .finally(() => {
        setIsLoading(false);
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        setShowLoading(false);
      });
  }, []);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [loadDocuments]);

  useEffect(() => {
    const treeStart = performance.now();
    const built = buildDirectoryTree(documents, effectiveDirectories);
    setTreeNodes(built);
    const duration = Math.round(performance.now() - treeStart);
    // eslint-disable-next-line no-console
    console.log(`[dms-debug] directory tree built at ${new Date().toISOString()} (${duration}ms)`);
  }, [documents, effectiveDirectories]);

  // Load selected document from URL
  useEffect(() => {
    const docId = searchParams.get('id');
    if (docId && documents.length > 0) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) {
        setSelectedDocument(doc);
      }
    }
  }, [searchParams, documents]);

  // Filter tree nodes based on search query
  const filteredTreeNodes = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return treeNodes;
    }

    const query = searchQuery.toLowerCase();
    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map((node) => {
          if (node.type === 'file') {
            // Check if file name matches
            if (node.name.toLowerCase().includes(query)) {
              return node;
            }
            return null;
          }

          // For directories, recursively filter children
          const filteredChildren = node.children ? filterNodes(node.children) : [];
          if (filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
            };
          }

          return null;
        })
        .filter((node): node is TreeNode => node !== null);
    };

    return filterNodes(treeNodes);
  }, [treeNodes, searchQuery]);

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'file' && node.document) {
      setSelectedDocument(node.document);
      // Update URL with document ID
      router.push(`/?id=${node.document.id}`, { scroll: false });
    }
  };

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <DocumentLayout
      sidebarHeader={
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ファイル名を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Link
              href="/settings"
              aria-label="設定を開く"
              className="inline-flex items-center justify-center rounded-md border border-border bg-muted p-2 hover:bg-muted/80 transition"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground">
              {filteredTreeNodes.length > 0
                ? `${filteredTreeNodes.reduce((count, node) => count + (node.children?.length || 1), 0)} 件見つかりました`
                : '該当するファイルがありません'}
            </p>
          )}
        </div>
      }
      sidebar={
        <DirectoryTree
          nodes={filteredTreeNodes}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedDocument?.fileUrl}
        />
      }
      content={<DocumentViewer document={selectedDocument} />}
    />
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
