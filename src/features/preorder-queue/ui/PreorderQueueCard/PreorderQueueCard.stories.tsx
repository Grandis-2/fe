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
  admitPerSecond: '8명',
  progressPercent: 65,
  leave: fn(),
  poll: { fetchStatus: 'idle', failureCount: 0 },
  mayHaveLeftQueue: false,
  rejoined: false,
} as const

export const Default: Story = {
  args: { queue },
}

// 새로고침 뒤 다시 진입했는데 서버가 지켜 둔 자리로 돌려줬다.
export const Rejoined: Story = {
  args: { queue: { ...queue, rejoined: true } },
}

// 직전 조회와 순번이 같다 — 줄이 멈췄다.
export const Paused: Story = {
  args: { queue: { ...queue, admitPerSecond: '0명' } },
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

// 움직이긴 하는데 1초에 1명이 안 된다 — 0으로 보이지 않게 한다.
export const Slow: Story = {
  args: { queue: { ...queue, admitPerSecond: '1명 미만' } },
}
