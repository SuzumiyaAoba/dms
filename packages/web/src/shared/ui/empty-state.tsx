'use client';

import { FileText } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Button, type ButtonProps } from './button';

interface EmptyStateAction extends ButtonProps {
  label: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        {icon ?? <FileText className="h-6 w-6" />}
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <Button {...action}>{action.label}</Button> : null}
    </div>
  );
}
