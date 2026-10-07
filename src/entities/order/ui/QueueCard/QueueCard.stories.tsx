import { fn } from 'storybook/test'

import { QueueCard } from './QueueCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: QueueCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof QueueCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    myOrderNumber: '131',
    waitTime: '약 4분',
    progressPercent: 65,
    totalWaitingCount: '373',
    onLeave: fn(),
  },
}

export const Complete: Story = {
  args: {
    ...Default.args,
    myOrderNumber: '1',
    waitTime: '1분 미만',
    progressPercent: 100,
  },
}
