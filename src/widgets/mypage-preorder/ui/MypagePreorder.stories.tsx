import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import type { Reservation } from '@entities/preorder'
import { color } from '@shared/config/theme'

import { MypagePreorder } from './MypagePreorder'

import type { Meta, StoryObj } from '@storybook/react-vite'

const HOUR = 60 * 60 * 1000
const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * HOUR).toISOString()

const reservation = (
  preorderId: string,
  overrides: Partial<Reservation>,
): Reservation => ({
  preorderId,
  productId: '20000000-0000-4000-8000-000000000015',
  productTitle: '갤럭시 Z 폴드8',
  optionId: '30000000-0000-4000-8000-000000001501',
  optionTitle: '실버 섀도우 / 512GB',
  unitPrice: 2399000,
  status: 'REGISTERED',
  displayStatus: 'PAYABLE',
  queuePosition: 412,
  shipmentBatch: {
    batchNumber: 1,
    positionFrom: 1,
    positionTo: 1000,
    estimatedShipStart: '2026-11-02',
    estimatedShipEnd: '2026-11-06',
  },
  createdAt: hoursFromNow(-3),
  payableFrom: hoursFromNow(-2),
  paymentDueAt: hoursFromNow(22),
  reservedAt: null,
  version: 2,
  ...overrides,
})

// 구매 확정 대기 두 건과 예약 확정 한 건.
const payable = [
  reservation('a', {}),
  reservation('b', {
    productTitle: '아이폰 18 Pro',
    paymentDueAt: hoursFromNow(5),
  }),
]
const inProgress = [
  reservation('c', {
    productTitle: '맥북 프로 14',
    status: 'RESERVED',
    displayStatus: 'RESERVED',
    paymentDueAt: null,
    reservedAt: hoursFromNow(-1),
  }),
]
const firstPage = (items: Reservation[]) => ({
  pages: [{ items, nextCursor: null }],
  pageParams: [undefined],
})

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다.
// 목록 키는 위젯이 묻는 화면 단계 묶음 — 구매 확정(NEEDS_PURCHASE)과 진행 중 탭.
const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
})
queryClient.setQueryData(
  ['reservations', 'mine', ['PAYABLE', 'PAYMENT_IN_PROGRESS']],
  firstPage(payable),
)
queryClient.setQueryData(
  ['reservations', 'mine', ['RECEIVED', 'PROCESSING', 'RESERVED', 'CANCELING']],
  firstPage(inProgress),
)
queryClient.setQueryData(['reservations', 'counts'], {
  RECEIVED: 0,
  PROCESSING: 0,
  PAYABLE: 2,
  PAYMENT_IN_PROGRESS: 0,
  PAYMENT_EXPIRED: 0,
  RESERVED: 1,
  CANCELING: 0,
  CANCELED: 0,
})
queryClient.setQueryData(
  ['openAlerts', 'mine'],
  [
    {
      productId: '20000000-0000-4000-8000-000000000016',
      title: 'iPhone Duo',
      opensAt: hoursFromNow(30),
      closesAt: hoursFromNow(44),
    },
  ],
)

const meta = {
  component: MypagePreorder,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div
          data-theme="dark"
          style={{ padding: 28, background: color.background.page }}
        >
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof MypagePreorder>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    // 예약 건마다 마감이 다르므로 카운트다운과 확정 버튼도 건별로 있어야 한다.
    const actions = canvas.getAllByRole('button', { name: '구매 확정하기' })
    await expect(actions).toHaveLength(2)
    const countdowns = canvas.getAllByText(/^\d{2}:\d{2}:\d{2}$/)
    await expect(countdowns).toHaveLength(2)
    await expect(countdowns[0].textContent).not.toBe(countdowns[1].textContent)

    // 구매 확정할 예약은 탭 위에 고정되고, 탭은 한 목록만 보인다 — 처음엔 진행 중.
    await expect(canvas.getByText('맥북 프로 14')).toBeVisible()
    await expect(canvas.queryByText('iPhone Duo')).toBeNull()

    // 오픈 알림은 알림 신청 탭에서 눌러서 끄고 켤 수 있다.
    await userEvent.click(canvas.getByRole('button', { name: /^알림 신청/ }))
    await expect(canvas.queryByText('맥북 프로 14')).toBeNull()
    await expect(
      canvas.getAllByRole('button', { name: '구매 확정하기' }),
    ).toHaveLength(2)
    const [firstAlert] = canvas.getAllByRole('button', { name: /오픈 알림$/ })
    await expect(firstAlert).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(firstAlert)
    await expect(firstAlert).toHaveAttribute('aria-pressed', 'false')

    // 다시 진행 중으로 돌아올 수 있다.
    await userEvent.click(canvas.getByRole('button', { name: /^진행 중/ }))
    await expect(await canvas.findByText('맥북 프로 14')).toBeVisible()
  },
}
