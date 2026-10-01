import { Tag } from './Tag'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Tag,
  tags: ['ai-generated'],
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Tag', color: 'primary', variant: 'solid', rounded: true },
}

export const Subtle: Story = {
  args: {
    children: 'Tag',
    color: 'primary',
    variant: 'subtle',
    rounded: true,
  },
}

export const Outline: Story = {
  args: {
    children: 'Tag',
    color: 'primary',
    variant: 'outline',
    rounded: true,
  },
}

export const Rect: Story = {
  args: { children: 'Tag', color: 'primary', variant: 'solid', rounded: false },
}

export const Medium: Story = {
  args: {
    children: 'Tag',
    color: 'primary',
    variant: 'solid',
    size: 'medium',
    rounded: true,
  },
}
