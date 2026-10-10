import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import type { Order } from '@entities/order'
import { color } from '@shared/config/theme'

import { MypageHistory } from './MypageHistory'

import type { Meta, StoryObj } from '@storybook/react-vite'

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

const order = (orderId: string, overrides: Partial<Order>): Order => ({
  orderId,
  status: 'AWAITING_PAYMENT',
  source: 'PREORDER',
  totalAmount: 2399000,
  items: [
    {
      productId: '20000000-0000-4000-8000-000000000015',
      optionId: '30000000-0000-4000-8000-000000001501',
      productTitle: '갤럭시 Z 폴드8',
      optionTitle: '실버 섀도우 / 512GB',
      unitPrice: 2399000,
      quantity: 1,
    },
  ],
  shipTo: {
    name: '홍길동',
    phone: '010-1234-5678',
    postalCode: '06236',
    line1: '서울특별시 강남구 테헤란로 152',
    line2: '101호',
  },
  createdAt: daysAgo(1),
  ...overrides,
})

// 일반 구매(BUY_NOW)는 아직 생기지 않지만 종류 필터를 확인하려고 한 건 둔다.
const orders = {
  items: [
    order('8d3f5a2c-1e4b-4c7d-9a6f-2b8e0c4d1f73', {}),
    order('1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9', {
      status: 'AWAITING_CONFIRMATION',
      createdAt: daysAgo(10),
    }),
    order('5c6d7e8f-9a0b-41c2-8d3e-4f5a6b7c8d9e', {
      status: 'DELIVERED',
      source: 'BUY_NOW',
      createdAt: daysAgo(30),
    }),
  ],
  nextCursor: null,
}

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다.
const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
})
queryClient.setQueryData(['orders', 'mine'], orders)

const meta = {
  component: MypageHistory,
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
} satisfies Meta<typeof MypageHistory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('결제 대기')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '예약 내역에서 결제하기' }),
    ).toBeVisible()
  },
}

export const FilterPreorder: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '사전예약' }))
    // 사전예약 주문 두 건만 남는다.
    await expect(canvas.getByText('2건')).toBeVisible()
  },
}
