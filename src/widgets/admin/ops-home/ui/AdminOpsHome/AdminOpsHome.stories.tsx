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
  /** 갤럭시 초당 입장 — 낮추면 대기가 길어진다 */
  galaxyCredit?: number
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
    products: [
      queueProduct(GALAXY, 3410, counts.galaxyCredit ?? 20),
      queueProduct(IPHONE, 14830, 80),
    ],
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
  queryClient.setQueryData(
    ['admin', 'orders', 'list', { status: 'AWAITING_CONFIRMATION', size: 1 }],
    orderPage(52),
  )
  queryClient.setQueryData(
    ['admin', 'orders', 'list', { status: 'SHIPPED', size: 1 }],
    orderPage(210),
  )
  queryClient.setQueryData(
    ['admin', 'products', 'list', { status: 'ACTIVE', size: 1 }],
    orderPage(42),
  )
  queryClient.setQueryData(
    ['admin', 'products', 'list', { status: 'PAUSED', size: 1 }],
    orderPage(3),
  )
  queryClient.setQueryData(
    ['admin', 'orders', 'list', { status: 'AWAITING_CONFIRMATION', size: 1 }],
    orderPage(52),
  )
  queryClient.setQueryData(
    ['admin', 'orders', 'list', { status: 'SHIPPED', size: 1 }],
    orderPage(210),
  )
  queryClient.setQueryData(
    ['admin', 'products', 'list', { status: 'ACTIVE', size: 1 }],
    orderPage(42),
  )
  queryClient.setQueryData(
    ['admin', 'products', 'list', { status: 'PAUSED', size: 1 }],
    orderPage(3),
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
 * 처음엔 전체 — 숫자·할 일은 모든 사전예약을 합친 값이고, 실패는 어느 사전예약에서 났는지
 * 나눠 적는다. 사전예약을 고르면 그 기준으로 바뀌고, 상품으로 거를 수 없는 배송은 '전체
 * 기준'이라고 밝힌다. 결제를 막는 실패는 맨 위에도 한 번 더 보인다.
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
    const picker = within(canvas.getByRole('group', { name: '볼 사전예약' }))
    await expect(picker.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // 사전예약마다 맨 뒤 대기를 타일로 본다.
    await expect(
      // 칩 섹션과 카드가 같은 제목이라 뒤에 오는 카드 영역에서 찾는다.
      within(
        canvas.getAllByRole('region', { name: '진행 중인 사전예약' }).at(-1)!,
      ).getByRole('button', { name: /갤럭시 S27/ }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: /외부 등록 실패/ }),
    ).toHaveTextContent('860건')

    // 결제를 막는 실패는 맨 위 긴급 카드에 — 사전예약별 칩과 재처리 버튼
    const urgent = canvas.getByRole('region', { name: '긴급 할 일' })
    await expect(urgent).toHaveTextContent('외부 등록 실패 860건')
    await expect(urgent).toHaveTextContent('아이폰 18 Pro 845')
    // 재처리는 예약 현황으로 가지 않고 이 화면에서 모달로 한다.
    await userEvent.click(
      within(urgent).getByRole('button', { name: '재처리하기' }),
    )
    const confirm = await canvas.findByRole('dialog')
    await expect(confirm).toHaveTextContent(
      '외부 등록 실패 860건을 재처리할까요?',
    )
    await userEvent.click(within(confirm).getByRole('button', { name: '취소' }))

    // 할 일 목록에도 한 번 더 — 실패 · 반영 실패 · 기한 지남
    const cards = canvas.getAllByRole('article')
    await expect(cards).toHaveLength(3)
    await expect(within(cards[0]).getAllByText('긴급')[0]).toBeVisible()
    await expect(cards[0]).toHaveTextContent('결제 막힘 · 외부 등록 실패 860건')
    await expect(
      within(cards[0]).getByRole('button', { name: '재처리' }),
    ).toBeVisible()

    // 사전예약을 고르면 숫자·할 일이 그 사전예약으로 바뀐다.
    await userEvent.click(picker.getByRole('button', { name: '아이폰 18 Pro' }))
    const scoped = canvas.getAllByRole('article')
    await expect(scoped[0]).toHaveTextContent('외부 등록 실패 845건')
    // 고른 사전예약만 재처리한다.
    await userEvent.click(
      within(scoped[0]).getByRole('button', { name: '재처리' }),
    )
    const scopedConfirm = await canvas.findByRole('dialog')
    await expect(scopedConfirm).toHaveTextContent(
      '아이폰 18 Pro 외부 등록 실패 845건을 재처리할까요?',
    )
    await userEvent.click(
      within(scopedConfirm).getByRole('button', { name: '취소' }),
    )
  },
}

/** 밀린 일이 없으면 한 줄로 끝난다 */
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
    await expect(card).toHaveTextContent('외부 등록')
    await expect(card).toHaveTextContent('120건')
    await expect(
      within(card).getByRole('link', { name: '속도 조절' }),
    ).toHaveAttribute('href', '/admin/waitingroom')
  },
}

/** 맨 뒤 예상 대기가 10분을 넘으면 '확인' 할 일로 올리고 대기열 관리로 보낸다 */
export const LongWait: Story = {
  decorators: [
    withData({
      registerFailures: 0,
      deadLetters: 0,
      paymentOverdue: 0,
      shipping: 0,
      galaxyCredit: 5,
    }),
  ],
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole('article')
    await expect(cards).toHaveLength(1)
    await expect(cards[0]).toHaveTextContent('갤럭시 S27 대기 약 11분')
    await expect(
      within(cards[0]).getByRole('link', { name: '속도 조절' }),
    ).toHaveAttribute('href', '/admin/waitingroom')
  },
}
