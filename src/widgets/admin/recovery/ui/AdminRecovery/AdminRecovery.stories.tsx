import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, fn, within } from 'storybook/test'

import { sentRunStore } from '../../model/sentRun'

import { AdminRecovery } from './AdminRecovery'

import type { Meta, StoryObj } from '@storybook/react-vite'

const IPHONE = 'p-iphone'
const GALAXY = 'p-galaxy'
const open = { PENDING: 0, PROCESSING: 0, RETRY_SCHEDULED: 0, DEAD_LETTER: 0 }

const statsOf = (failures: number) => ({
  productId: null,
  preorders: {
    PENDING_SYNC: 900,
    REGISTERED: 3000,
    RESERVED: 400,
    CANCELING: 0,
    CANCELED: 12,
  },
  syncJobs: { REGISTER: { ...open, DEAD_LETTER: failures }, CANCEL: open },
  deadLetters: { waiting: 0, oldestWaitingAt: null },
  paymentOverdue: 0,
  oldestPendingSyncAt: null,
  countedAt: '2026-10-08T05:00:00Z',
})

const queueProduct = (productId: string) => ({
  productId,
  phase: 'OPEN',
  runtime: 'QUEUEING',
  waiting: 500,
  credit: 50,
  cap: 150,
  opensAt: '2026-10-08T05:00:00Z',
  closesAt: '2026-10-08T07:00:00Z',
})

// Storybook엔 MSW가 없어 조회가 실패한다 — 캐시를 미리 채워 값이 있는 화면을 본다.
const withFailures =
  (groups: { errorCode: string; count: number }[]) =>
  (Story: () => React.ReactNode) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const total = groups.reduce((sum, group) => sum + group.count, 0)
    queryClient.setQueryData(
      ['admin', 'reservations', 'stats', undefined],
      statsOf(total),
    )
    // 실패는 아이폰에 몰려 있다.
    queryClient.setQueryData(
      ['admin', 'reservations', 'stats', IPHONE],
      statsOf(Math.max(0, total - 10)),
    )
    queryClient.setQueryData(
      ['admin', 'reservations', 'stats', GALAXY],
      statsOf(Math.min(10, total)),
    )
    queryClient.setQueryData(
      ['admin', 'reservations', 'sync-job-errors', 'dead-letter'],
      groups,
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
      products: [queueProduct(IPHONE), queueProduct(GALAXY)],
    })
    return (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    )
  }

const meta = {
  component: AdminRecovery,
  tags: ['ai-generated'],
  args: {
    productNames: new Map([
      [IPHONE, '아이폰 18 Pro'],
      [GALAXY, '갤럭시 S27'],
    ]),
    selected: null,
    onSelect: fn(),
  },
} satisfies Meta<typeof AdminRecovery>

export default meta
type Story = StoryObj<typeof meta>

const causes = [
  { errorCode: 'TIMEOUT', count: 40 },
  { errorCode: 'MOCK_REJECTED', count: 6 },
  { errorCode: 'HTTP_503', count: 820 },
]

/**
 * 전체 — 맨 위 한 줄이 지금 상태를 말하고, 다시 보내기 카드 하나에서 원인을 고르고 보낸다.
 * 일시 장애만 기본으로 골라지고 거절은 빠져 있다(그 줄에 이유와 한 건씩 보기)
 */
export const All: Story = {
  decorators: [withFailures(causes)],
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByText(/866건이 다시 보내기를 기다려요/),
    ).toBeVisible()
    await expect(canvas.queryByText(/^1\./)).toBeNull()

    const [first] = canvas.getAllByRole('checkbox')
    await expect(first.closest('label')).toHaveTextContent(
      '외부 예약 시스템 일시 중단',
    )
    await expect(
      canvas.getByRole('checkbox', { name: /접수를 거절/ }),
    ).not.toBeChecked()
    await expect(canvas.getByText(/보내도 같은 결과예요/)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '860건 다시 보내기' }),
    ).toBeEnabled()

    await userEvent.click(
      canvas.getByRole('checkbox', { name: /응답하지 않음/ }),
    )
    await expect(canvas.getByText('보낼 실패 820건')).toBeVisible()
    await expect(canvas.getByText(/약 41초에 나눠 보내요/)).toBeVisible()
    // 회복 확인은 보내기 전에도 지금 실패 수를 보인다.
    await expect(canvas.getByText('지금 실패 866건')).toBeVisible()
  },
}

/**
 * 사전예약을 고르면 상태·회복 확인은 그 사전예약 기준이다. 사전예약별 보내기는 서버가
 * 상품 조건을 받기 전까지 막혀 있고, 전체로 돌아가 보낼 수 있다
 */
export const ProductSelected: Story = {
  args: { selected: IPHONE },
  decorators: [withFailures(causes)],
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByText(/^아이폰 18 Pro — 856건이 다시 보내기를 기다려요/),
    ).toBeVisible()
    await expect(canvas.getByText('지금 실패 856건')).toBeVisible()
    await expect(
      canvas.getByText(/모든 사전예약을 합친 값이에요/),
    ).toBeVisible()
    // 사전예약별 보내기 자리는 있지만 서버 준비 전이라 막혀 있다.
    await expect(
      canvas.getByRole('button', { name: '아이폰 18 Pro 다시 보내기' }),
    ).toBeDisabled()
    await expect(canvas.getByText('아이폰 18 Pro 실패 856건')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '전체에서 보내기' }),
    )
    await expect(args.onSelect).toHaveBeenCalledWith(null)
  },
}

/** 다시 보낼 실패가 없으면 상태 한 줄이 그렇다고 말하고 보내기를 막는다 */
export const NothingToSend: Story = {
  decorators: [withFailures([])],
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('다시 보낼 외부 등록 실패가 없어요.'),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '0건 다시 보내기' }),
    ).toBeDisabled()
  },
}

/**
 * 보낸 뒤 — 진행 막대 대신 다시 보내기 카드 아래 보낸 기록에 처리 상태와 결과(남은 실패)를 보인다.
 * 예상 시간이 지난 기록을 넣어 끝난 상태를 본다(보내기는 Storybook에서 API가 없어 못 한다).
 */
export const AfterSend: Story = {
  decorators: [
    withFailures([
      { errorCode: 'HTTP_503', count: 12 },
      { errorCode: 'TIMEOUT', count: 0 },
    ]),
    (Story) => {
      sentRunStore.add({
        at: Date.now() - 120_000,
        targetCount: 860,
        skippedCount: 0,
        estimatedSeconds: 43,
        capped: false,
        failuresAtSend: { all: 860 },
        byErrorCode: { HTTP_503: 820, TIMEOUT: 40 },
      })
      return <Story />
    },
  ],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('progressbar')).toBeNull()
    // 보낸 기록 — 끝났고 그 원인들의 남은 실패가 12건
    const [row] = within(
      canvas.getByRole('list', { name: '보낸 기록' }),
    ).getAllByRole('listitem')
    await expect(row).toHaveTextContent('860건 다시 보냄')
    await expect(row).toHaveTextContent('처리 끝 · 같은 원인 실패 지금 12건')
    await expect(canvas.getByText('실패 860 → 12건')).toBeVisible()
    await expect(canvas.getByText('848건 줄었어요')).toBeVisible()
  },
}
