import type { Document } from '@/shared/model/document';

export interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: TreeNode[];
  document?: Document;
}

/**
 * Extract relative path from full file path
 * Finds the common base directory and returns the relative path from there
 */
function extractRelativePath(fullPath: string, baseName: string = 'org-roam'): string {
  const parts = fullPath.split('/');
  const baseIndex = parts.indexOf(baseName);

  if (baseIndex === -1) {
    // Base not found, return last few parts
    return parts.slice(-3).join('/');
  }

  // Return everything after the base directory
  return parts.slice(baseIndex + 1).join('/');
}

/**
 * Build a directory tree from a flat list of documents
 */
export function buildDirectoryTree(documents: Document[]): TreeNode[] {
  const root: TreeNode[] = [];
  const pathMap = new Map<string, TreeNode>();

  // Sort documents by file path for consistent tree building
  const sortedDocs = [...documents].sort((a, b) => a.fileUrl.localeCompare(b.fileUrl));

  for (const doc of sortedDocs) {
    // Extract relative path from org-roam directory
    const relativePath = extractRelativePath(doc.fileUrl);
    const pathParts = relativePath.split('/').filter(Boolean);

    // Skip if path is too short
    if (pathParts.length === 0) continue;

    let currentPath = '';
    let currentLevel = root;

    // Build directory structure
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLastPart = i === pathParts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // Check if node already exists
      let node = pathMap.get(currentPath);

      if (!node) {
        // Create new node
        node = {
          id: doc.fileUrl,
          name: part,
          type: isLastPart ? 'file' : 'directory',
          path: currentPath,
          children: isLastPart ? undefined : [],
          document: isLastPart ? doc : undefined,
        };

        pathMap.set(currentPath, node);
        currentLevel.push(node);
      }

      // Move to next level
      if (!isLastPart && node.children) {
        currentLevel = node.children;
      }
    }
  }

  return root;
}

/**
 * Get the base directory name from storage path
 */
export function getBaseDirectory(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'Documents';
}

/**
 * Flatten tree to get all file nodes
 */
export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];

  function traverse(node: TreeNode) {
    if (node.type === 'file') {
      result.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return result;
}
