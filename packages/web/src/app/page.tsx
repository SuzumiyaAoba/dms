'use client';

import { useEffect, useState } from 'react';
import { DocumentViewer } from '@/entities/document';
import { apiClient } from '@/shared/api/api-client';
import { buildDirectoryTree, type TreeNode } from '@/shared/lib/directory-tree';
import type { Document } from '@/shared/model/document';
import { DirectoryTree } from '@/widgets/directory-tree';
import { DocumentLayout } from '@/widgets/document-layout';

export default function Home() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [_documents, setDocuments] = useState<Document[]>([]);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      sidebar={
        <DirectoryTree
          nodes={treeNodes}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedDocument?.fileUrl}
        />
      }
      content={<DocumentViewer document={selectedDocument} />}
    />
  );
}
