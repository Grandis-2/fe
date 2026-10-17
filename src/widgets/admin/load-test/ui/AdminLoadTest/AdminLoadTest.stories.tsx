import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, fn } from 'storybook/test'

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
  args: {
    productNames: new Map([
      [IPHONE, '아이폰 18 Pro'],
      [GALAXY, '갤럭시 S27'],
    ]),
    onSelectProduct: fn(),
  },
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

/** 전체 보기 — 상품별 대기열을 나눠 보이고, 행을 누르면 그 상품으로 들어간다 */
export const AllProducts: Story = {
  decorators: [withData],
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('총 대기 인원')).toBeVisible()
    await expect(canvas.getByText('5,000명')).toBeVisible()
    await userEvent.click(canvas.getByText('갤럭시 S27'))
    await expect(args.onSelectProduct).toHaveBeenCalledWith(GALAXY)
  },
}

/** 상품 하나 — 그 상품의 대기 인원과 입장 속도·상한만 본다 */
export const OneProduct: Story = {
  decorators: [withData],
  args: { productId: IPHONE },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('대기 인원')).toBeVisible()
    await expect(canvas.getByText('4,200명')).toBeVisible()
    await expect(canvas.getByText('100명/초')).toBeVisible()
    await expect(canvas.getByText('상한 150명/초')).toBeVisible()
    await expect(canvas.queryByText('갤럭시 S27')).toBeNull()
    await expect(
      canvas.getByText(/외부 등록이 실패 중인 작업.*전체 상품 기준/),
    ).toBeVisible()
  },
}

/** 시험을 시작하면 그 시각부터 세고, 종료하면 구간을 Grafana 링크에 담는다 */
export const TestRun: Story = {
  decorators: [withData],
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
