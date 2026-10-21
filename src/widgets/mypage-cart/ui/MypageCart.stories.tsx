import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { type CartLine } from '@entities/cart'
import { color } from '@shared/config/theme'

import { MypageCart } from './MypageCart'

import type { Meta, StoryObj } from '@storybook/react-vite'

const line = (cartItemId: string, overrides: Partial<CartLine>): CartLine => ({
  cartItemId,
  productId: '20000000-0000-4000-8000-000000000002',
  variantId: '30000000-0000-4000-8000-000000000200',
  productTitle: '맥북 프로 14',
  optionTitle: '스페이스 블랙 / 512GB',
  imageUrl: null,
  warranty: false,
  quantity: 1,
  unitPrice: 2390000,
  warrantyPrice: 0,
  lineAmount: 2390000,
  availableQuantity: 10,
  purchasable: true,
  unavailableReason: null,
  ...overrides,
})

// 두 줄은 살 수 있고, 판매 중지 줄 하나는 고를 수 없다.
const lines: CartLine[] = [
  line('a0000000-0000-4000-8000-000000000001', {}),
  line('a0000000-0000-4000-8000-000000000002', {
    productTitle: '갤럭시 G999',
    optionTitle: '256GB 블랙',
    quantity: 2,
    unitPrice: 1290000,
    lineAmount: 2580000,
  }),
  line('a0000000-0000-4000-8000-000000000003', {
    productTitle: 'NOVA 마우스',
    optionTitle: '실버 / 256GB',
    unitPrice: 59000,
    lineAmount: 59000,
    purchasable: false,
    unavailableReason: 'PAUSED',
  }),
]

// Storybook엔 MSW가 없어 장바구니 조회가 실패한다 — 캐시를 미리 채우고 다시 묻지 않게 한다.
// data를 안 주면 끝나지 않는 조회를 걸어 두어 불러오는 중으로 멈춘다.
const withCart = (data?: CartLine[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  })
  if (data) queryClient.setQueryData(['cart', 'lines'], data)
  else
    void queryClient.prefetchQuery({
      queryKey: ['cart', 'lines'],
      queryFn: () => new Promise<never>(() => {}),
    })
  return (Story: () => React.ReactNode) => (
    <QueryClientProvider client={queryClient}>
      <div
        data-theme="dark"
        style={{ padding: 28, background: color.background.page }}
      >
        <Story />
      </div>
    </QueryClientProvider>
  )
}

const meta = {
  component: MypageCart,
  tags: ['ai-generated'],
  decorators: [withCart(lines)],
} satisfies Meta<typeof MypageCart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('맥북 프로 14')).toBeInTheDocument()
    await expect(canvas.getByText('256GB 블랙')).toBeInTheDocument()
    // 살 수 없는 줄은 이유가 붙는다.
    await expect(canvas.getByText('판매가 중지된 상품이에요.')).toBeVisible()
  },
}

export const SelectAll: Story = {
  play: async ({ canvas, userEvent }) => {
    // 첫 번째가 전체 선택 체크박스다.
    const [selectAll, first, second] = canvas.getAllByRole('checkbox')

    await userEvent.click(selectAll)
    await expect(first).toBeChecked()
    await expect(second).toBeChecked()

    // 합계는 살 수 있는 줄의 줄 금액 합이다 — 2,390,000 + 1,290,000 x 2(판매 중지 줄은 빠진다).
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
    await expect(
      canvas.getByText('장바구니에 담긴 상품이 없어요.'),
    ).toBeVisible()
  },
}

export const Loading: Story = {
  decorators: [withCart()],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  },
}
