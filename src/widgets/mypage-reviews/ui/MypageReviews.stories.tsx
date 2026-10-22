import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import type { Order } from '@entities/order'
import type { Review } from '@entities/review'
import { color } from '@shared/config/theme'

import { MypageReviews } from './MypageReviews'

import type { Meta, StoryObj } from '@storybook/react-vite'

const review: Review = {
  reviewId: '40000000-0000-4000-8000-000000000001',
  productId: '20000000-0000-4000-8000-000000000010',
  productTitle: 'NOVA 태블릿 1',
  optionTitle: '실버 / 256GB',
  imageUrl: null,
  rating: 4,
  body: '가볍고 화면이 충분히 커서 강의 필기용으로 딱이에요.',
  authorName: '김**',
  createdAt: '2026-09-16T03:12:00Z',
  updatedAt: '2026-09-16T03:12:00Z',
  orderItemId: '50000000-0000-4000-8000-000000000001',
}

const myReviews = {
  page: 0,
  size: 100,
  total: 1,
  hasNext: false,
  items: [review],
}

// 배송 완료된 바로 구매 주문 — 둘째 주문상품은 위 리뷰가 붙어 있고, 첫째만 '작성 가능'이다.
const deliveredOrder: Order = {
  orderId: '51000000-0000-4000-8000-000000000001',
  status: 'DELIVERED',
  source: 'BUY_NOW',
  totalAmount: 2_150_000,
  paymentDueAt: null,
  items: [
    {
      orderItemId: '50000000-0000-4000-8000-000000000002',
      productId: '20000000-0000-4000-8000-000000000001',
      optionId: '30000000-0000-4000-8000-000000000101',
      productTitle: 'NOVA 스마트폰 1',
      optionTitle: '블랙 / 256GB',
      unitPrice: 1_200_000,
      quantity: 1,
      warrantyQuantity: 0,
      warrantyUnitPrice: 0,
      lineAmount: 1_200_000,
      imageUrl: null,
    },
    {
      orderItemId: review.orderItemId ?? '',
      productId: review.productId,
      optionId: '30000000-0000-4000-8000-000000001001',
      productTitle: review.productTitle,
      optionTitle: review.optionTitle,
      unitPrice: 950_000,
      quantity: 1,
      warrantyQuantity: 0,
      warrantyUnitPrice: 0,
      lineAmount: 950_000,
      imageUrl: null,
    },
  ],
  shipTo: {
    name: '홍길동',
    phone: '01012345678',
    postalCode: '06236',
    line1: '서울특별시 강남구 테헤란로 152',
    line2: null,
  },
  createdAt: '2026-09-10T03:00:00Z',
}

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다.
const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
})
queryClient.setQueryData(['reviews', 'mine'], myReviews)
queryClient.setQueryData(['orders', 'mine'], {
  items: [deliveredOrder],
  nextCursor: null,
})

const meta = {
  component: MypageReviews,
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
} satisfies Meta<typeof MypageReviews>

export default meta
type Story = StoryObj<typeof meta>

// 전체 — 작성 가능 한 건(리뷰 쓰기)과 작성 완료 한 건(수정·삭제)이 함께 보인다.
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/강의 필기용/)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '리뷰 수정' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '리뷰 쓰기' }),
    ).toBeVisible()
  },
}

export const FilterWritable: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^작성 가능/ }))
    await expect(
      canvas.getByRole('button', { name: '리뷰 쓰기' }),
    ).toBeVisible()
    await expect(canvas.queryByText(/강의 필기용/)).not.toBeInTheDocument()
  },
}

export const FilterWritten: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^작성 완료/ }))
    await expect(canvas.getByText(/강의 필기용/)).toBeVisible()
    await expect(
      canvas.queryByRole('button', { name: '리뷰 쓰기' }),
    ).not.toBeInTheDocument()
  },
}
