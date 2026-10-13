import { fn } from 'storybook/test'

import { PreorderQueueCard } from './PreorderQueueCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderQueueCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof PreorderQueueCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    queue: {
      myOrder: 131,
      waitTime: '약 4분',
      totalWaiting: 373,
      progressPercent: 65,
      leave: fn(),
    },
  },
}
