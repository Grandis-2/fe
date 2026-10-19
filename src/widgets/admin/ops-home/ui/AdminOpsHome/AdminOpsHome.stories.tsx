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
  /** 외부 등록을 기다리는 가장 오래된 접수 — 주면 등록 대기 작업도 있다고 본다 */
  slowSince?: string
}

const statsOf = ({
  registerFailures,
  deadLetters,
  paymentOverdue,
  slowSince,
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
    REGISTER: {
      ...open,
      PENDING: slowSince ? 120 : 0,
      DEAD_LETTER: registerFailures,
    },
    CANCEL: open,
  },
  deadLetters: {
    waiting: deadLetters,
    oldestWaitingAt: deadLetters ? '2026-10-08T04:35:00Z' : null,
  },
  paymentOverdue,
  oldestPendingSyncAt: slowSince ?? null,
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
  // 진행 중인 두 사전예약 — 실패는 아이폰에 몰려 있다.
  queryClient.setQueryData(
    ['admin', 'reservations', 'stats', IPHONE],
    statsOf({ ...counts, registerFailures: counts.registerFailures - 15 }),
  )
  queryClient.setQueryData(
    ['admin', 'reservations', 'stats', GALAXY],
    statsOf({
      ...counts,
      registerFailures: Math.min(15, counts.registerFailures),
    }),
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

/**
 * 사전예약이 언제나 하나 골라져 있고(처음엔 첫 번째), 할 일·대기열 상태가 그 사전예약
 * 기준이다. 상품으로 거를 수 없는 원인·다시 보내기·배송은 '전체 기준'이라고 밝힌다.
 */
export const Busy: Story = {
  decorators: [
    withData({
      registerFailures: 860,
      deadLetters: 12,
      paymentOverdue: 24,
      shipping: 37,
    }),
  ],
  play: async ({ canvas, userEvent }) => {
    const strip = within(
      canvas.getByRole('group', { name: '진행 중인 사전예약' }),
    )
    const galaxy = strip.getByRole('button', { name: /갤럭시 S27/ })
    const iphone = strip.getByRole('button', { name: /아이폰 18 Pro/ })
    await expect(galaxy).toHaveAttribute('aria-pressed', 'true')
    await expect(strip.queryByRole('button', { name: '전체' })).toBeNull()
    await expect(iphone).toHaveTextContent('재처리 필요 845건')
    await expect(
      canvas.getByRole('heading', { name: '갤럭시 S27의 대기열 상태' }),
    ).toBeVisible()

    const cards = canvas.getAllByRole('article')
    await expect(cards).toHaveLength(4)
    await expect(within(cards[0]).getAllByText('긴급')[0]).toBeVisible()
    await expect(cards[0]).toHaveTextContent('외부 등록 실패 15건')
    await expect(cards[0]).toHaveTextContent(
      '원인(전체 기준) 외부 예약 시스템 일시 중단 820건',
    )
    await expect(
      within(cards[0]).getByRole('link', {
        name: '원인별로 다시 보내기 (전체)',
      }),
    ).toHaveAttribute('href', '/admin/recovery')
    await expect(cards[3]).toHaveTextContent('배송 처리 대기 주문 37건')
    await expect(cards[3]).toHaveTextContent('전체 기준')

    // 다른 사전예약을 누르면 할 일·대기열 상태가 그 사전예약으로 바뀐다.
    await userEvent.click(iphone)
    await expect(iphone).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getAllByRole('article')[0]).toHaveTextContent(
      '외부 등록 실패 845건',
    )
    await expect(
      canvas.getByRole('region', { name: '아이폰 18 Pro의 대기열 상태' }),
    ).toHaveTextContent('14,830명')
  },
}

/** 밀린 일이 없으면 한 줄로 끝난다. 상품별 대기열 표 대신 고른 사전예약의 대기열 상태 */
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
    await expect(canvas.queryByRole('table')).toBeNull()
    await expect(
      canvas.getByRole('region', { name: '갤럭시 S27의 대기열 상태' }),
    ).toBeVisible()
  },
}

/** 외부 등록이 1분 넘게 밀리면 '확인' 할 일로 올리고 대기열 관리로 보낸다 */
export const Slow: Story = {
  decorators: [
    withData({
      registerFailures: 0,
      deadLetters: 0,
      paymentOverdue: 0,
      shipping: 0,
      // 집계를 받은 시각(지금)보다 한참 전 — 1분을 넘는다.
      slowSince: '2020-01-01T00:00:00Z',
    }),
  ],
  play: async ({ canvas }) => {
    const [card] = canvas.getAllByRole('article')
    await expect(card).toHaveTextContent('외부 등록이')
    await expect(card).toHaveTextContent('기다리는 예약 120건')
    await expect(
      within(card).getByRole('link', { name: '입장 속도 조절' }),
    ).toHaveAttribute('href', '/admin/waitingroom')
  },
}
