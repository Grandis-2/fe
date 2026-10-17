import { fn } from 'storybook/test'

import { PreorderQueueCard } from './PreorderQueueCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderQueueCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof PreorderQueueCard>

export default meta
type Story = StoryObj<typeof meta>

const queue = {
  myOrder: 131,
  waitTime: '약 4분',
  totalWaiting: 373,
  progressPercent: 65,
  leave: fn(),
  poll: { fetchStatus: 'idle', failureCount: 0 },
  mayHaveLeftQueue: false,
} as const

export const Default: Story = {
  args: { queue },
}

// 조회가 실패해 다시 묻는 중 — 순번은 마지막 값 그대로다.
export const Retrying: Story = {
  args: {
    queue: { ...queue, poll: { fetchStatus: 'fetching', failureCount: 2 } },
  },
}

// 250초 넘게 조회에 성공하지 못했다 — 조회는 계속하고 자리를 장담하지 않는다.
export const MayHaveLeftQueue: Story = {
  args: {
    queue: {
      ...queue,
      poll: { fetchStatus: 'fetching', failureCount: 6 },
      mayHaveLeftQueue: true,
    },
  },
}
