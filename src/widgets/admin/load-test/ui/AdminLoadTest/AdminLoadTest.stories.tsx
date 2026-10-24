import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { AdminLoadTest } from './AdminLoadTest'

import type { Meta, StoryObj } from '@storybook/react-vite'

const IPHONE = 'p-iphone'
const GALAXY = 'p-galaxy'
const count = { PENDING: 0, PROCESSING: 0, RETRY_SCHEDULED: 0, DEAD_LETTER: 2 }

const statsOf = (productId: string | null) => ({
  productId,
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

const queueProduct = (productId: string, waiting: number, credit: number) => ({
  productId,
  phase: 'OPEN',
  runtime: 'QUEUEING',
  waiting,
  credit,
  cap: 150,
  opensAt: '2026-10-08T05:00:00Z',
  closesAt: '2026-10-08T07:00:00Z',
})

// Storybook엔 MSW가 없어 조회가 실패한다 — 캐시를 미리 채워 값이 있는 화면을 본다.
const withData = (Story: () => React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  for (const productId of [undefined, IPHONE]) {
    queryClient.setQueryData(
      ['admin', 'reservations', 'stats', productId],
      statsOf(productId ?? null),
    )
  }
  queryClient.setQueryData(['admin', 'waitingroom', 'status'], {
    nodeId: 'node-1',
    leaderNodeId: 'node-1',
    snapshotStale: false,
    snapshotAgeSeconds: 0,
    gateways: 2,
    globalCredit: 150,
    brakeFactor: 1,
    maxWaitSeconds: null,
    leaveGraceSeconds: 250,
    products: [queueProduct(IPHONE, 4200, 100), queueProduct(GALAXY, 800, 50)],
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
  // 기록한 구간이 브라우저에 남아 이야기끼리 섞이지 않게 비운다.
  beforeEach: () => localStorage.removeItem('nova.admin.load-test.recording'),
} satisfies Meta<typeof AdminLoadTest>

export default meta
type Story = StoryObj<typeof meta>

/** 값을 못 받아도 틀(조작·차트 자리·점검)은 보인다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('실시간')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: 'Grafana ↗' }),
    ).toHaveAttribute('target', '_blank')
    await expect(canvas.getByRole('link', { name: 'Mock 설정' })).toBeVisible()
    await expect(canvas.getByText('처리 중 적체')).toBeVisible()
  },
}

/** 전체 — 접수 중인 상품의 대기 인원을 더하고, 입장 속도는 전역 값이다 */
export const AllProducts: Story = {
  decorators: [withData],
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('5,000명')[0]).toBeVisible()
    await expect(canvas.getAllByText('150명/초')[0]).toBeVisible()
  },
}

/** 상품 하나 — 그 상품의 대기 인원과 입장 속도·상한만 본다 */
export const OneProduct: Story = {
  decorators: [withData],
  args: { productId: IPHONE },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('4,200명')[0]).toBeVisible()
    await expect(canvas.getAllByText('100명/초')[0]).toBeVisible()
    await expect(canvas.getByText('상한 150')).toBeVisible()
    await expect(canvas.getByText(/전체 상품 기준/)).toBeVisible()
  },
}

/** 구간 기록 — 시작하면 '기록 중', 끝내면 기록한 구간 표에 한 줄이 남는다 */
export const Recording: Story = {
  decorators: [withData],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '구간 기록 시작' }),
    )
    await expect(canvas.getByText(/기록 중/)).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: 'Grafana ↗' }).getAttribute('href'),
    ).toMatch(/from=\d+&to=now/)
    await userEvent.click(canvas.getByRole('button', { name: '기록 끝' }))
    await expect(canvas.getByText('실시간')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '결과 복사' }),
    ).toBeVisible()
  },
}
