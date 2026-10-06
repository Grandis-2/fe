import { fn } from 'storybook/test'

import { QueuePill } from './QueuePill'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: QueuePill,
  tags: ['ai-generated'],
} satisfies Meta<typeof QueuePill>

export default meta
type Story = StoryObj<typeof meta>

const queue = {
  status: 'waiting',
  ahead: 130,
  waitTime: '약 4분',
  holdSeconds: 299,
  reopen: fn(),
} as const

export const Waiting: Story = {
  args: { productName: '아이폰 18 Pro', queue },
}

// 마지막 1분 — 타이머가 빨갛게 바뀐다.
export const HoldEnding: Story = {
  args: { productName: '아이폰 18 Pro', queue: { ...queue, holdSeconds: 42 } },
}

export const Mine: Story = {
  args: {
    productName: '아이폰 18 Pro',
    queue: { ...queue, status: 'mine', ahead: 0 },
  },
}

export const Expired: Story = {
  args: {
    productName: '아이폰 18 Pro',
    queue: { ...queue, status: 'expired', holdSeconds: 0 },
  },
}
