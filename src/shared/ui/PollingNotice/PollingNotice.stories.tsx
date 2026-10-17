import { fn } from 'storybook/test'

import { PollingNotice } from './PollingNotice'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PollingNotice,
} satisfies Meta<typeof PollingNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Retrying: Story = {
  args: { query: { fetchStatus: 'fetching', failureCount: 2 } },
}

export const Offline: Story = {
  args: { query: { fetchStatus: 'paused', failureCount: 0 } },
}

// 제한 시간이 지나 자동 조회를 멈췄다 — 사용자가 [다시 확인]을 눌러야 다시 묻는다.
export const TimedOut: Story = {
  args: {
    query: { fetchStatus: 'idle', failureCount: 0 },
    timeout: {
      title: '결제 결과를 확인하지 못했어요. 주문 내역에서 확인해 주세요.',
      description: '다시 결제하지 마세요.',
      onRecheck: fn(),
    },
  },
}
