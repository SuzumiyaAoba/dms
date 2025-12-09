import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '@/shared/ui';

const meta = {
  title: 'Shared/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextLine: Story = {
  args: {
    className: 'h-4 w-48',
  },
};

export const Card: Story = {
  render: () => (
    <div className="w-64 rounded-lg border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  ),
};
