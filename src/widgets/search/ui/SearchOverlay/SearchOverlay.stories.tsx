import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { expect, fireEvent, fn } from 'storybook/test'

import type { ProductListItem } from '@entities/product'

import { SearchOverlay } from './SearchOverlay'

import type { Meta, StoryObj } from '@storybook/react-vite'

const product = (productId: number, title: string): ProductListItem => ({
  productId,
  saleMode: 'IN_STOCK',
  title,
  imageUrl: '/images/macbook_neo_sliver1.png',
  status: 'ACTIVE',
  minPrice: 1690000,
  sellable: true,
  soldOut: false,
  preorderStatus: null,
  opensAt: null,
  closesAt: null,
})

const page = (items: ProductListItem[], size: number) => ({
  items,
  page: 0,
  size,
  total: items.length,
  hasNext: false,
})

// 입력은 fireEvent로 넣는다 — userEvent.type은 dialog 안 입력창에서 React onChange가 안 불렸다.
// Storybook엔 MSW가 없어 조회가 실패한다 — 요청을 끄고 캐시만 채운다.
const withCache = (keywords: Record<string, ProductListItem[]>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { enabled: false } },
  })
  // 0건일 때 대신 보여 주는 상품(ProductResults의 fallback).
  queryClient.setQueryData(
    ['products', 'list', { size: 4 }],
    page([product(1, 'NOVA 스마트폰 1'), product(2, 'NOVA 태블릿 1')], 4),
  )
  for (const [keyword, items] of Object.entries(keywords)) {
    queryClient.setQueryData(
      ['products', 'list', { q: keyword, size: 8 }],
      page(items, 8),
    )
  }
  return (Story: () => React.ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}

const meta = {
  component: SearchOverlay,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: fn() },
  decorators: [
    withCache({
      맥북: [product(10, '맥북 프로 14'), product(11, '맥북 에어 13')],
      없는상품: [],
    }),
  ],
} satisfies Meta<typeof SearchOverlay>

export default meta
type Story = StoryObj<typeof meta>

// 검색어가 없을 때 — 인기 검색어·카테고리·사전예약.
export const Idle: Story = {}

export const Results: Story = {
  play: async ({ canvas }) => {
    fireEvent.change(await canvas.findByRole('searchbox'), {
      target: { value: '맥북' },
    })
    await expect(
      await canvas.findByRole('heading', { name: '상품' }),
    ).toBeInTheDocument()
  },
}

// 검색 훅은 키워드가 있으면 스스로 요청을 켜서(enabled) 캐시를 비워 두는 것만으론 실패 화면이 된다.
// 오프라인으로 두면 요청이 멈춘 채 pending에 머문다.
export const Loading: Story = {
  beforeEach: () => {
    onlineManager.setOnline(false)
    return () => onlineManager.setOnline(true)
  },
  play: async ({ canvas }) => {
    fireEvent.change(await canvas.findByRole('searchbox'), {
      target: { value: '아이폰' },
    })
  },
}

export const Empty: Story = {
  play: async ({ canvas }) => {
    fireEvent.change(await canvas.findByRole('searchbox'), {
      target: { value: '없는상품' },
    })
    await expect(
      await canvas.findByText("'없는상품' 검색 결과가 없어요"),
    ).toBeInTheDocument()
  },
}

// Esc는 <dialog> 기본 동작으로 닫힌다.
export const CloseWithEscape: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}
