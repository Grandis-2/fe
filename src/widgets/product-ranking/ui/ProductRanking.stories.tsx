import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { ProductCardSummary } from '@entities/product'
import { bestProductCards } from '@shared/api/mock/fixtures/productCards'
import { color, spacing } from '@shared/config/theme'

import { ProductRanking } from './ProductRanking'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 순위가 10위(두 자리 칸)까지 보이도록 베스트 목업을 이어 붙여 10개를 만든다.
const tenProducts: ProductCardSummary[] = Array.from(
  { length: 10 },
  (_, i) => ({
    ...bestProductCards[i % bestProductCards.length],
    productId: `rank-${i + 1}`,
    name: `NOVA MacBook Neo ${i + 1}`,
  }),
)

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다. 안 채우면 로딩에 머문다.
const withProducts = (data?: ProductCardSummary[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: false,
      },
    },
  })
  if (data) queryClient.setQueryData(['products', 'cards', 'best'], data)
  return (Story: () => React.ReactNode) => (
    <QueryClientProvider client={queryClient}>
      {/* 어두운 구간 전용 위젯(흰 글자)이라 어두운 바탕에 올린다. */}
      <div
        style={{
          background: color.backgroundDark.base,
          padding: spacing[40],
        }}
      >
        <Story />
      </div>
    </QueryClientProvider>
  )
}

const meta = {
  component: ProductRanking,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProductRanking>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [withProducts(tenProducts)],
}

export const Loading: Story = {
  decorators: [withProducts()],
}

export const Empty: Story = {
  decorators: [withProducts([])],
}
