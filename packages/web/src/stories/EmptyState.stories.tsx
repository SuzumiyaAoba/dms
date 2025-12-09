import type { Meta, StoryObj } from '@storybook/react';
import { FilePlus2, FolderOpen } from 'lucide-react';
import { EmptyState } from '@/shared/ui';

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  args: {
    title: 'まだドキュメントがありません',
    description: '新しいドキュメントを作成してみましょう。',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    icon: <FolderOpen className="h-7 w-7" />,
  },
};

export const WithAction: Story = {
  args: {
    icon: <FilePlus2 className="h-7 w-7" />,
    action: {
      label: 'ドキュメントを作成',
      onClick: () => {
        // Placeholder action for Storybook
        alert('新規作成');
      },
    },
  },
};
