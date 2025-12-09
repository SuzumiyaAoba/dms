import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/shared/ui';

const meta = {
  title: 'Shared/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Badge',
    variant: 'default',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['default', 'secondary', 'outline', 'success', 'warning', 'danger'] as const).map(
        (variant) => (
          <Badge key={variant} {...args} variant={variant}>
            {variant}
          </Badge>
        ),
      )}
    </div>
  ),
};
