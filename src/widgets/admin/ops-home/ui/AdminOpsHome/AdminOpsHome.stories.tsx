import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, within } from 'storybook/test'

import { AdminOpsHome } from './AdminOpsHome'

import type { Meta, StoryObj } from '@storybook/react-vite'

const IPHONE = 'p-iphone'
const GALAXY = 'p-galaxy'
const open = { PENDING: 0, PROCESSING: 0, RETRY_SCHEDULED: 0, DEAD_LETTER: 0 }

type Counts = {
  registerFailures: number
  deadLetters: number
  paymentOverdue: number
  shipping: number
}

const statsOf = ({
  registerFailures,
  deadLetters,
  paymentOverdue,
}: Counts) => ({
  productId: null,
  preorders: {
    PENDING_SYNC: 120,
    REGISTERED: 3000,
    RESERVED: 400,
    CANCELING: 0,
    CANCELED: 12,
  },
  syncJobs: {
    REGISTER: { ...open, DEAD_LETTER: registerFailures },
    CANCEL: open,
  },
  deadLetters: {
    waiting: deadLetters,
    oldestWaitingAt: deadLetters ? '2026-10-08T04:35:00Z' : null,
  },
  paymentOverdue,
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

const orderPage = (total: number) => ({ items: [], page: 0, size: 1, total })

// Storybook엔 MSW가 없어 조회가 실패한다 — 캐시를 미리 채워 값이 있는 화면을 본다.
const withData = (counts: Counts) => (Story: () => React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClient.setQueryData(
    ['admin', 'reservations', 'stats', undefined],
    statsOf(counts),
  )
  queryClient.setQueryData(
    ['admin', 'reservations', 'sync-job-errors'],
    counts.registerFailures
      ? [
          { errorCode: 'HTTP_503', count: counts.registerFailures - 40 },
          { errorCode: 'TIMEOUT', count: 40 },
        ]
      : [],
  )
  queryClient.setQueryData(['admin', 'waitingroom', 'status'], {
    nodeId: 'node-1',
    leaderNodeId: 'node-1',
    snapshotStale: false,
    snapshotAgeSeconds: 0,
    gateways: 2,
    globalCredit: 100,
    brakeFactor: 1,
    maxWaitSeconds: null,
    leaveGraceSeconds: 250,
    products: [queueProduct(GALAXY, 3410, 20), queueProduct(IPHONE, 14830, 80)],
  })
  queryClient.setQueryData(['admin', 'draws', 'list'], [])
  queryClient.setQueryData(
    ['admin', 'orders', 'list', { status: 'PREPARING_ITEMS', size: 1 }],
    orderPage(counts.shipping),
  )
  queryClient.setQueryData(
    ['admin', 'orders', 'list', { status: 'READY_TO_SHIP', size: 1 }],
    orderPage(0),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}

const meta = {
  component: AdminOpsHome,
  tags: ['ai-generated'],
  args: {
    productNames: new Map([
      [IPHONE, '아이폰 18 Pro'],
      [GALAXY, '갤럭시 S27'],
    ]),
  },
} satisfies Meta<typeof AdminOpsHome>

export default meta
type Story = StoryObj<typeof meta>

/** 급한 일부터 — 외부 등록 실패(긴급)가 맨 위, 배송(할 일)이 아래 */
export const Busy: Story = {
  decorators: [
    withData({
      registerFailures: 860,
      deadLetters: 12,
      paymentOverdue: 24,
      shipping: 37,
    }),
  ],
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('article')
    await expect(cards).toHaveLength(4)
    await expect(within(cards[0]).getAllByText('긴급')[0]).toBeVisible()
    await expect(cards[0]).toHaveTextContent('외부 등록 실패 860건')
    await expect(cards[0]).toHaveTextContent('HTTP_503 820건 · TIMEOUT 40건')
    await expect(
      within(cards[0]).getByRole('link', { name: '원인별로 다시 보내기' }),
    ).toHaveAttribute('href', '/admin/recovery')
    await expect(cards[3]).toHaveTextContent('배송 처리 대기 주문 37건')
  },
}

/** 밀린 일이 없으면 한 줄로 끝난다. 대기열은 대기 많은 순 */
export const AllClear: Story = {
  decorators: [
    withData({
      registerFailures: 0,
      deadLetters: 0,
      paymentOverdue: 0,
      shipping: 0,
    }),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.queryAllByRole('article')).toHaveLength(0)
    await expect(canvas.getByText(/밀린 일이 없어요/)).toBeVisible()
    const rows = canvas.getAllByRole('row')
    // 머리줄 다음 첫 행이 대기가 가장 많은 상품이다.
    await expect(rows[1]).toHaveTextContent('아이폰 18 Pro')
  },
}
