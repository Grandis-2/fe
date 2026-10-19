import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { BacklogTrend } from './BacklogTrend'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: BacklogTrend,
  tags: ['ai-generated'],
  args: { prefix: '외부 등록 대기' },
} satisfies Meta<typeof BacklogTrend>

export default meta
type Story = StoryObj<typeof meta>

/** 집계를 아직 못 받았으면 숫자 대신 대시 — 0건으로 읽히지 않게 */
export const NoData: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('—')).toBeVisible()
  },
}

/** 집계를 받았으면 외부 등록 대기 건수를 보인다(추이는 표본이 두 개 이상 쌓인 뒤에 붙는다) */
export const WithCount: Story = {
  decorators: [
    (Story) => {
      const client = new QueryClient()
      client.setQueryData(['admin', 'reservations', 'stats', undefined], {
        productId: null,
        preorders: {
          PENDING_SYNC: 3210,
          REGISTERED: 0,
          RESERVED: 0,
          CANCELING: 0,
          CANCELED: 0,
        },
        syncJobs: {
          REGISTER: {
            PENDING: 0,
            PROCESSING: 0,
            RETRY_SCHEDULED: 0,
            DEAD_LETTER: 0,
          },
          CANCEL: {
            PENDING: 0,
            PROCESSING: 0,
            RETRY_SCHEDULED: 0,
            DEAD_LETTER: 0,
          },
        },
        deadLetters: { waiting: 0, oldestWaitingAt: null },
        paymentOverdue: 0,
        oldestPendingSyncAt: null,
        countedAt: '2026-10-08T05:00:00Z',
      })
      return (
        <QueryClientProvider client={client}>
          <Story />
        </QueryClientProvider>
      )
    },
  ],
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/외부 등록 대기 3,210건/)).toBeVisible()
  },
}
