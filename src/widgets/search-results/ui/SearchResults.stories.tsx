import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { products } from '@shared/api/mock/fixtures/product'
import {
  bestProductCards,
  searchProductCardGroups,
} from '@shared/api/mock/fixtures/productCards'
import { color } from '@shared/config/theme'

import { SearchResults } from './SearchResults'

import type { Meta, StoryObj } from '@storybook/react-vite'

const OPTIONS = { size: 100, sort: 'RECOMMENDED' }

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다.
const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
})
queryClient.setQueryData(['products', 'cards', 'best'], bestProductCards)
for (const [keyword, items] of Object.entries({
  맥북: products.filter(({ name }) => name.includes('맥북')),
  없는상품: [],
})) {
  queryClient.setQueryData(['products', 'keyword', keyword, OPTIONS], {
    items,
    page: 0,
    size: OPTIONS.size,
    total: items.length,
    totalPages: 1,
    hasNext: false,
  })
}

// 카테고리 둘러보기 — undefined 필터는 쿼리 키 해시에서 빠지므로 category만 넣으면 맞는다.
const mobileCards = searchProductCardGroups
  .filter(({ category }) => category === '모바일')
  .flatMap(({ cards }) => cards)
queryClient.setQueryData(
  ['products', 'cards', 'search', { category: '모바일' }],
  {
    items: mobileCards,
    total: mobileCards.length,
  },
)

const meta = {
  component: SearchResults,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div
          style={{ minHeight: '100vh', background: color.backgroundDark.base }}
        >
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof SearchResults>

export default meta
type Story = StoryObj<typeof meta>

export const Results: Story = {
  parameters: { initialEntries: ['/search/results?q=맥북'] },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: '상품' }),
    ).toBeInTheDocument()
  },
}

export const Empty: Story = {
  parameters: { initialEntries: ['/search/results?q=없는상품'] },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("'없는상품' 검색 결과가 없어요"),
    ).toBeInTheDocument()
  },
}

export const Category: Story = {
  parameters: { initialEntries: ['/search?category=모바일'] },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: '모바일' }),
    ).toBeInTheDocument()
    await expect(canvas.getByRole('searchbox')).toHaveValue('')
  },
}
