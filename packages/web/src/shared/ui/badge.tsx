import type * as React from 'react';
import { cn } from '@/shared/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  secondary: 'bg-secondary text-secondary-foreground ring-1 ring-border',
  outline: 'bg-transparent text-foreground ring-1 ring-border',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  danger: 'bg-destructive/10 text-destructive ring-1 ring-destructive/25',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
