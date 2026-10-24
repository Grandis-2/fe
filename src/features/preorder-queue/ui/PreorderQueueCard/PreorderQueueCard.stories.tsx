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
  admitPace: '지금 분당 약 180명 입장 중',
  progressPercent: 65,
  leave: fn(),
  poll: { fetchStatus: 'idle', failureCount: 0 },
  mayHaveLeftQueue: false,
} as const

export const Default: Story = {
  args: { queue },
}

// 직전 조회와 순번이 같다 — 줄이 멈춰도 자리는 그대로라고 알린다.
export const Paused: Story = {
  args: {
    queue: { ...queue, admitPace: '입장이 잠시 멈췄어요 · 자리는 그대로예요' },
  },
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
