import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import type { ProductListItem } from '@entities/product'
import { categories } from '@shared/api/mock/fixtures/product'
import { color } from '@shared/config/theme'

import { SearchResults } from './SearchResults'

import type { Meta, StoryObj } from '@storybook/react-vite'

const PAGE = { page: 0, size: 12 }

const product = (productId: string, title: string): ProductListItem => ({
  productId,
  saleMode: 'IN_STOCK',
  title,
  imageUrl: '/images/macbook_neo_sliver1.png',
  status: 'ACTIVE',
  minPrice: 1290000,
  sellable: true,
  soldOut: false,
  preorderStatus: null,
  opensAt: null,
  closesAt: null,
})

const listPage = (items: ProductListItem[]) => ({
  ...PAGE,
  total: items.length,
  hasNext: false,
  items,
})

// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다.
// undefined 필터는 쿼리 키 해시에서 빠지므로 쓰는 값만 넣으면 맞는다.
const queryClient = new QueryClient({
  defaultOptions: { queries: { enabled: false } },
})
queryClient.setQueryData(['categories'], categories)
queryClient.setQueryData(
  ['products', 'list', { q: '맥북', ...PAGE }],
  listPage([product('1', '맥북 프로 14'), product('2', '맥북 에어 13')]),
)
queryClient.setQueryData(
  ['products', 'list', { q: '없는상품', ...PAGE }],
  listPage([]),
)
queryClient.setQueryData(
  ['products', 'list', { categoryId: categories[0].categoryId, ...PAGE }],
  listPage([product('3', 'NOVA 스마트폰 1'), product('4', 'NOVA 태블릿 1')]),
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
    await expect(await canvas.findByText('맥북 프로 14')).toBeInTheDocument()
  },
}

export const Empty: Story = {
  parameters: { initialEntries: ['/search/results?q=없는상품'] },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("'없는상품' 검색 결과가 없어요."),
    ).toBeInTheDocument()
  },
}

export const Category: Story = {
  parameters: { initialEntries: [`/search?category=${categories[0].name}`] },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('heading', { name: categories[0].name }),
    ).toBeInTheDocument()
    await expect(canvas.getByRole('searchbox')).toHaveValue('')
  },
}
