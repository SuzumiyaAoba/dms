'use client';

import { Search } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { DocumentViewer } from '@/entities/document';
import { apiClient } from '@/shared/api';
import { buildDirectoryTree, type TreeNode } from '@/shared/lib/directory-tree';
import type { Document } from '@/shared/model/document';
import { DirectoryTree } from '@/widgets/directory-tree';
import { DocumentLayout } from '@/widgets/document-layout';

export default function Home() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load documents on mount
  useEffect(() => {
    apiClient
      .listDocuments(1, 100)
      .then((response) => {
        const docs = response.items;
        setDocuments(docs);
        setTreeNodes(buildDirectoryTree(docs));
      })
      .catch((error) => {
        console.error('Failed to load documents:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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

  // Create root node to wrap all tree nodes
  const treeNodesWithRoot = React.useMemo(() => {
    if (filteredTreeNodes.length === 0) {
      return [];
    }

    const rootNode: TreeNode = {
      id: 'root',
      name: 'org-roam',
      type: 'directory',
      path: 'root',
      children: filteredTreeNodes,
    };

    return [rootNode];
  }, [filteredTreeNodes]);

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'file' && node.document) {
      setSelectedDocument(node.document);
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
        <div className="space-y-2">
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
          nodes={treeNodesWithRoot}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedDocument?.fileUrl}
        />
      }
      content={<DocumentViewer document={selectedDocument} />}
    />
  );
}
