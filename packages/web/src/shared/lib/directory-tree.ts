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
function extractRelativePath(
  fullPath: string,
  baseDirectories: string[],
): { relativePath: string; rootName: string } {
  const parts = fullPath.split('/');

  const normalize = (dir: string) => dir.replace(/\/+$/, '');
  const normalizedBases = baseDirectories.map(normalize);

  for (const base of normalizedBases) {
    if (!base) continue;
    if (fullPath === base || fullPath.startsWith(`${base}/`)) {
      const relative = fullPath.slice(base.length).replace(/^\/+/, '');
      const baseName = base.split('/').filter(Boolean).pop() ?? base;
      return {
        relativePath: relative,
        rootName: baseName,
      };
    }
  }

  // Base not found, return last few parts with a generic root
  const fallbackRoot = baseDirectories[0]?.split('/').filter(Boolean).pop() ?? 'Documents';
  return {
    relativePath: parts.slice(-3).join('/'),
    rootName: fallbackRoot,
  };
}

/**
 * Build a directory tree from a flat list of documents
 */
export function buildDirectoryTree(
  documents: Document[],
  baseDirectories: string[] = [],
): TreeNode[] {
  const roots: TreeNode[] = [];
  const pathMap = new Map<string, TreeNode>();
  const bases = baseDirectories.length > 0 ? baseDirectories : ['zettelkasten'];

  // Sort documents by file path for consistent tree building
  const sortedDocs = [...documents].sort((a, b) => a.fileUrl.localeCompare(b.fileUrl));

  for (const doc of sortedDocs) {
    const { relativePath, rootName } = extractRelativePath(doc.fileUrl, bases);
    const pathParts = relativePath.split('/').filter(Boolean);

    // Skip if path is too short
    if (pathParts.length === 0) continue;

    const rootPath = rootName || 'root';
    let rootNode = pathMap.get(rootPath);
    if (!rootNode) {
      rootNode = {
        id: `root-${rootPath}`,
        name: rootName || 'root',
        type: 'directory',
        path: rootPath,
        children: [],
      };
      pathMap.set(rootPath, rootNode);
      roots.push(rootNode);
    }

    let currentPath = '';
    let currentLevel = rootNode.children ?? [];

    // Build directory structure
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLastPart = i === pathParts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : `${rootPath}/${part}`;

      // Check if node already exists
      let node = pathMap.get(currentPath);

      if (!node) {
        // Create new node
        node = {
          id: isLastPart ? doc.fileUrl : currentPath,
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

  return roots;
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
