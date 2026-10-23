import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import type { Review } from '@entities/review'
import { color } from '@shared/config/theme'

import { ProductReviews } from './ProductReviews'

import type { Meta, StoryObj } from '@storybook/react-vite'

const PRODUCT_ID = '20000000-0000-4000-8000-000000000002'
const EMPTY_PRODUCT_ID = '20000000-0000-4000-8000-000000000003'

const review = (n: number): Review => ({
  reviewId: `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  productId: PRODUCT_ID,
  productTitle: 'NOVA 스마트폰 2',
  optionTitle: '실버 / 512GB',
  imageUrl: null,
  rating: 5 - (n % 3),
  body: `${n}번째 후기 — 배송도 빠르고 색상이 사진이랑 똑같아서 만족합니다.`,
  authorName: '이**',
  createdAt: '2026-07-02T05:00:00Z',
  updatedAt: '2026-07-02T05:00:00Z',
  orderItemId: null,
})

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 1쪽 캐시만 채운다(12건 → 2쪽).
const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
})
queryClient.setQueryData(['reviews', 'product', PRODUCT_ID, 0], {
  items: Array.from({ length: 10 }, (_, i) => review(i + 1)),
  page: 0,
  size: 10,
  total: 12,
  hasNext: true,
})
queryClient.setQueryData(['reviews', 'product', EMPTY_PRODUCT_ID, 0], {
  items: [],
  page: 0,
  size: 10,
  total: 0,
  hasNext: false,
})

const meta = {
  component: ProductReviews,
  tags: ['ai-generated'],
  args: { productId: PRODUCT_ID },
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
} satisfies Meta<typeof ProductReviews>

export default meta
type Story = StoryObj<typeof meta>

// 10건이 넘으면 아래에 쪽 번호가 붙는다.
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^1번째 후기/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: '2' })).toBeVisible()
  },
}

export const Empty: Story = {
  args: { productId: EMPTY_PRODUCT_ID },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('아직 등록된 후기가 없어요')).toBeVisible()
    await expect(canvas.queryByRole('navigation')).not.toBeInTheDocument()
  },
}
