import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

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

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다.
const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
})
queryClient.setQueryData(['reviews', 'mine'], myReviews)

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

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/강의 필기용/)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '리뷰 수정' }),
    ).toBeVisible()
  },
}
