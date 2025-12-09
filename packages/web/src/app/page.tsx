'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DocumentViewer } from '@/entities/document';
import { SyncButton } from '@/features/document-sync';
import { apiClient } from '@/shared/api';
import { buildDirectoryTree, type TreeNode } from '@/shared/lib/directory-tree';
import type { Document } from '@/shared/model/document';
import { DirectoryTree } from '@/widgets/directory-tree';
import { DocumentLayout } from '@/widgets/document-layout';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncDirectories, setSyncDirectories] = useState<string[]>([]);
  const [directoryInput, setDirectoryInput] = useState('');

  // Load documents function
  const loadDocuments = React.useCallback(() => {
    setIsLoading(true);
    apiClient
      .listDocuments(1, 100)
      .then((response) => {
        setDocuments(response.items);
      })
      .catch((error) => {
        console.error('Failed to load documents:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const effectiveDirectories = useMemo(
    () => (syncDirectories.length > 0 ? syncDirectories : ['zettelkasten']),
    [syncDirectories],
  );

  useEffect(() => {
    setTreeNodes(buildDirectoryTree(documents, effectiveDirectories));
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

  const handleAddDirectory = () => {
    const value = directoryInput.trim();
    if (!value) return;
    setSyncDirectories((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setDirectoryInput('');
  };

  const handleRemoveDirectory = (dir: string) => {
    setSyncDirectories((prev) => prev.filter((d) => d !== dir));
  };

  const handleSyncComplete = (directories: string[]) => {
    if (directories.length > 0) {
      setSyncDirectories(directories);
    }
    loadDocuments();
  };

  const handleDirectoryInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddDirectory();
    }
  };

  if (isLoading) {
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
          <div className="space-y-2 rounded-md border border-border bg-card p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">同期対象ディレクトリ</p>
              <p className="text-xs text-muted-foreground">
                ルートディレクトリを1行ずつ追加してください（~/path 形式も可）。
              </p>
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
            <div className="flex flex-wrap gap-2">
              {syncDirectories.map((dir) => (
                <span
                  key={dir}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1 text-xs"
                >
                  <span className="max-w-[220px] truncate" title={dir}>
                    {dir}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDirectory(dir)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`${dir} を削除`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {syncDirectories.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  未指定の場合は既定のストレージパスを使用します
                </span>
              )}
            </div>
            <SyncButton directories={syncDirectories} onSyncComplete={handleSyncComplete} />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ファイル名を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
