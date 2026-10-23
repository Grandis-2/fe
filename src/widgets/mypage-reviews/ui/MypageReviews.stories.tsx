import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import type { Review, WritableItem } from '@entities/review'
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

const firstPage = <TItem,>(items: TItem[]) => ({
  pages: [{ page: 0, size: 20, total: items.length, hasNext: false, items }],
  pageParams: [0],
})

// 배송 완료된 바로 구매 주문상품 중 리뷰가 없는 한 건 — '작성 가능'.
const writableItem: WritableItem = {
  orderItemId: '50000000-0000-4000-8000-000000000002',
  orderId: '51000000-0000-4000-8000-000000000001',
  productId: '20000000-0000-4000-8000-000000000001',
  optionId: '30000000-0000-4000-8000-000000000101',
  productTitle: 'NOVA 스마트폰 1',
  optionTitle: '블랙 / 256GB',
  imageUrl: null,
  quantity: 1,
  lineAmount: 1_200_000,
  orderedAt: '2026-09-10T03:00:00Z',
}

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다.
const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
})
queryClient.setQueryData(['reviews', 'writable'], firstPage([writableItem]))
queryClient.setQueryData(['reviews', 'mine', 'pages'], firstPage([review]))

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
