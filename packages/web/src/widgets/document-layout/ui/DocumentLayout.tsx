'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

interface DocumentLayoutProps {
  sidebarHeader?: React.ReactNode;
  sidebar: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function DocumentLayout({
  sidebarHeader,
  sidebar,
  content,
  className,
}: DocumentLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = React.useState(280);
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseDown = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className={cn('flex h-screen w-full overflow-hidden bg-background', className)}>
      {/* Sidebar */}
      <div
        className="h-full border-r border-border bg-card overflow-y-auto flex flex-col"
        style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
      >
        {sidebarHeader && (
          <div className="p-4 border-b border-border flex-shrink-0">{sidebarHeader}</div>
        )}
        <div className="flex-1 p-4 overflow-y-auto">{sidebar}</div>
      </div>

      {/* Resize Handle */}
      <button
        type="button"
        aria-label="サイドバーのサイズ変更"
        className={cn(
          'w-[2px] cursor-col-resize hover:bg-primary/20 transition-colors bg-border focus:outline-none focus:ring-2 focus:ring-primary',
          isResizing && 'bg-primary/40',
        )}
        onMouseDown={handleMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            setSidebarWidth((prev) => Math.max(200, prev - 20));
          } else if (e.key === 'ArrowRight') {
            setSidebarWidth((prev) => Math.min(500, prev + 20));
          }
        }}
      />

      {/* Content Area */}
      <div className="flex-1 h-full overflow-hidden bg-background flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8">{content}</div>
        </div>
      </div>
    </div>
  );
}
