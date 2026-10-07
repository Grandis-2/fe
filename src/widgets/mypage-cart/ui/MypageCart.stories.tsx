import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { type CartItem } from '@entities/cart'

import { MypageCart } from './MypageCart'

import type { Meta, StoryObj } from '@storybook/react-vite'

const items: CartItem[] = [
  {
    id: 'cart-1',
    productId: 'MBP-14',
    optionCode: 'MBP-512-BLK',
    quantity: 1,
    price: 2390000,
  },
  {
    id: 'cart-2',
    productId: 'SM-G999',
    optionCode: 'SM-256-BLK',
    quantity: 2,
    price: 1290000,
  },
]

const productDetails = {
  'MBP-14': {
    title: '맥북 프로 14',
    imageUrl: null,
    variants: [{ sku: 'MBP-512-BLK', title: '512GB 스페이스 블랙' }],
  },
  'SM-G999': {
    title: '갤럭시 G999',
    imageUrl: null,
    variants: [{ sku: 'SM-256-BLK', title: '256GB 블랙' }],
  },
}

// Storybook엔 MSW가 없어 장바구니 조회가 실패한다 — 캐시를 미리 채우고 다시 묻지 않게 한다.
const withCart = (data: CartItem[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  })
  queryClient.setQueryData(['cart', 'items'], data)
  for (const item of data) {
    const product =
      productDetails[item.productId as keyof typeof productDetails]
    if (product) {
      queryClient.setQueryData(['products', 'detail', item.productId], {
        ...product,
        productId: item.productId,
      })
    }
  }
  return (Story: () => React.ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}

const meta = {
  component: MypageCart,
  tags: ['ai-generated'],
  decorators: [withCart(items)],
} satisfies Meta<typeof MypageCart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('맥북 프로 14')).toBeInTheDocument()
    await expect(canvas.getByText('256GB 블랙')).toBeInTheDocument()
  },
}

export const SelectAll: Story = {
  play: async ({ canvas, userEvent }) => {
    // 첫 번째가 전체 선택 체크박스다.
    const [selectAll, first, second] = canvas.getAllByRole('checkbox')

    await userEvent.click(selectAll)
    await expect(first).toBeChecked()
    await expect(second).toBeChecked()

    // 리모컨 합계는 선택한 상품의 (단가 x 수량) 합이다 — 2,390,000 + 1,290,000 x 2.
    await expect(canvas.getAllByText('4,970,000원')[0]).toBeVisible()

    // 하나라도 해제하면 전체 선택도 풀린다.
    await userEvent.click(first)
    await expect(selectAll).not.toBeChecked()

    // 남은 하나를 다시 채우면 전체 선택이 자동으로 켜진다.
    await userEvent.click(first)
    await expect(selectAll).toBeChecked()

    await userEvent.click(selectAll)
    await expect(first).not.toBeChecked()
    await expect(second).not.toBeChecked()
    await expect(canvas.getAllByText('0원')[0]).toBeVisible()
  },
}

export const Empty: Story = {
  decorators: [withCart([])],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('장바구니가 비어 있어요.')).toBeVisible()
  },
}
