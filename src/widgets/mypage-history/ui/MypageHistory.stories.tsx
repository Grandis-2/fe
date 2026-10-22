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
  paymentDueAt: null,
  items: [
    {
      orderItemId: '60000000-0000-4000-8000-000000001501',
      productId: '20000000-0000-4000-8000-000000000015',
      optionId: '30000000-0000-4000-8000-000000001501',
      productTitle: '갤럭시 Z 폴드8',
      optionTitle: '실버 섀도우 / 512GB',
      unitPrice: 2399000,
      quantity: 1,
      warrantyQuantity: 0,
      warrantyUnitPrice: 0,
      lineAmount: 2399000,
      // 사전예약 주문은 사진이 없다.
      imageUrl: null,
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

// 결제 대기·배송 준비·배송 완료 한 건씩 — 상태 칩 확인용.
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
// 쓴 리뷰가 없다 — 배송 완료 주문상품에 '리뷰 쓰기'가 붙는다.
queryClient.setQueryData(['reviews', 'mine'], { items: [] })

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
    // '결제 대기'는 요약 칸 라벨, 상태 칩, 첫 주문의 상태 태그, 세 곳에 그려진다.
    const awaiting = canvas.getAllByText('결제 대기')
    await expect(awaiting).toHaveLength(3)
    for (const element of awaiting) await expect(element).toBeVisible()
    // 사전예약 결제 대기는 사전예약 내역에서 결제한다 — 주문 내역엔 버튼이 없다.
    await expect(
      canvas.queryByRole('button', { name: /결제하기/ }),
    ).not.toBeInTheDocument()
  },
}

export const FilterDelivered: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getAllByRole('article')).toHaveLength(3)
    await userEvent.click(canvas.getByRole('button', { name: '배송 완료' }))
    // 배송 완료 주문 한 건만 남는다.
    await expect(canvas.getAllByRole('article')).toHaveLength(1)
  },
}
