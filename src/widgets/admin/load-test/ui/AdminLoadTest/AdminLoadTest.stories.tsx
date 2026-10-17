import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { AdminLoadTest } from './AdminLoadTest'

import type { Meta, StoryObj } from '@storybook/react-vite'

const count = { PENDING: 0, PROCESSING: 0, RETRY_SCHEDULED: 0, DEAD_LETTER: 2 }

// Storybook엔 MSW가 없어 집계 조회가 실패한다 — 캐시를 미리 채워 [시험 시작]을 누를 수 있게 한다.
const withStats = (Story: () => React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClient.setQueryData(['admin', 'reservations', 'stats', undefined], {
    productId: null,
    preorders: {
      PENDING_SYNC: 12,
      REGISTERED: 300,
      RESERVED: 40,
      CANCELING: 0,
      CANCELED: 5,
    },
    syncJobs: { REGISTER: count, CANCEL: { ...count, DEAD_LETTER: 0 } },
    deadLetters: { waiting: 1, oldestWaitingAt: null },
    paymentOverdue: 0,
    oldestPendingSyncAt: null,
    countedAt: '2026-10-08T05:00:00Z',
  })
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}

const meta = {
  component: AdminLoadTest,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminLoadTest>

export default meta
type Story = StoryObj<typeof meta>

/** 세 구역과 Grafana·조작 화면 링크가 보인다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'Grafana 열기' }),
    ).toHaveAttribute('target', '_blank')
    await expect(
      canvas.getByRole('link', { name: '대기열 관리' }),
    ).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Mock 설정' })).toBeVisible()
    await expect(canvas.getByText('처리 중 적체')).toBeVisible()
  },
}

/** 시험을 시작하면 그 시각부터 세고, 종료하면 구간을 Grafana 링크에 담는다 */
export const TestRun: Story = {
  decorators: [withStats],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '시험 시작' }))
    await expect(canvas.getByText('시험 시작 뒤 접수')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '시험 종료' }))
    const grafana = canvas.getByRole('link', {
      name: '이 시험 구간을 Grafana에서 보기',
    })
    await expect(grafana.getAttribute('href')).toMatch(/from=\d+&to=\d+/)
    await expect(
      canvas.getByRole('button', { name: '새 시험 시작' }),
    ).toBeVisible()
  },
}
