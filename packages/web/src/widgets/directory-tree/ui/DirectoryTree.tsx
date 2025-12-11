'use client';

import {
  Archive,
  ChevronRight,
  FileCode,
  FileText,
  FileType,
  Folder,
  FolderOpen,
  Image,
  NotebookPen,
} from 'lucide-react';
import * as React from 'react';
import type { TreeNode } from '@/shared/lib/directory-tree';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

interface DirectoryTreeProps {
  nodes: TreeNode[];
  onNodeClick?: (node: TreeNode) => void;
  selectedNodeId?: string;
  className?: string;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  onNodeClick?: (node: TreeNode) => void;
  selectedNodeId?: string;
}

function TreeItem({ node, level, onNodeClick, selectedNodeId }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const indentation = level * 16 + 8;

  const iconForFile = () => {
    const ext = node.name.toLowerCase().split('.').pop() || '';
    if (['md', 'mdown', 'markdown'].includes(ext)) {
      return <FileType className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
    if (ext === 'org') {
      return <NotebookPen className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
      return <Image className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
    if (['zip', 'tar', 'gz', 'tgz', 'bz2', '7z', 'rar'].includes(ext)) {
      return <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
    if (
      [
        'ts',
        'tsx',
        'js',
        'jsx',
        'json',
        'yml',
        'yaml',
        'toml',
        'sh',
        'bash',
        'zsh',
        'py',
        'rs',
        'go',
        'java',
        'c',
        'cpp',
        'h',
        'hpp',
        'cs',
        'css',
        'scss',
        'sass',
        'less',
      ].includes(ext)
    ) {
      return <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
    // Markdown / org / text
    return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
  };

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      onNodeClick?.(node);
    }
  };

  return (
    <div className="relative">
      {level > 0 && (
        <span
          className="absolute top-0 bottom-0 w-px bg-border opacity-70 pointer-events-none"
          style={{ left: `${indentation - 12}px` }}
          aria-hidden
        />
      )}
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-2 px-2 py-1.5 h-auto font-normal text-foreground',
          'hover:bg-accent hover:text-accent-foreground transition-colors',
          'rounded-md relative',
          isSelected && 'bg-accent text-accent-foreground font-medium',
        )}
        style={{ paddingLeft: `${indentation}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform text-muted-foreground',
              isExpanded && 'rotate-90',
            )}
          />
        )}
        {!hasChildren && node.type === 'file' && <div className="w-4" />}
        {node.type === 'directory' ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-primary/70" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-primary/70" />
          )
        ) : (
          iconForFile()
        )}
        <span className="truncate text-sm flex-1 min-w-0 text-left">{node.name}</span>
      </Button>
      {hasChildren && isExpanded && (
        <div className="relative mt-0.5">
          {level > 0 && (
            <span
              className="absolute top-0 bottom-0 w-px bg-border opacity-70 pointer-events-none"
              style={{ left: `${indentation - 12}px` }}
              aria-hidden
            />
          )}
          {node.children?.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DirectoryTree({
  nodes,
  onNodeClick,
  selectedNodeId,
  className,
}: DirectoryTreeProps) {
  return (
    <div className={cn('w-full', className)}>
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          onNodeClick={onNodeClick}
          selectedNodeId={selectedNodeId}
        />
      ))}
    </div>
  );
}
