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
  moveIn: 5,
  reopen: fn(),
} as const

export const Waiting: Story = {
  args: { productName: '아이폰 18 Pro', queue },
}

// 내 앞 10명 이하 — 곧 화면이 넘어갈 수 있다고 미리 알린다.
export const Soon: Story = {
  args: { productName: '아이폰 18 Pro', queue: { ...queue, ahead: 6 } },
}

// 마지막 1분 — 타이머가 빨갛게 바뀐다.
export const HoldEnding: Story = {
  args: { productName: '아이폰 18 Pro', queue: { ...queue, holdSeconds: 42 } },
}

// 모달을 닫아 둔 채 내 차례 — 이동까지 남은 초를 센다.
export const Mine: Story = {
  args: {
    productName: '아이폰 18 Pro',
    queue: { ...queue, status: 'mine', ahead: 0, moveIn: 3 },
  },
}

export const Expired: Story = {
  args: {
    productName: '아이폰 18 Pro',
    queue: { ...queue, status: 'expired', holdSeconds: 0 },
  },
}
