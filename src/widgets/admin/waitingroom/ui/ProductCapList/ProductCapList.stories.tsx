import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, fn } from 'storybook/test'

import { ProductCapList } from './ProductCapList'

import type { Meta, StoryObj } from '@storybook/react-vite'

const product = (productId: string, waiting: number, credit: number) => ({
  productId,
  phase: 'OPEN' as const,
  runtime: 'QUEUEING' as const,
  waiting,
  credit,
  cap: 150,
  // 서버처럼 대기 ÷ 초당 입장(올림), 멈췄으면 null
  estimatedWaitSeconds: credit > 0 ? Math.ceil(waiting / credit) : null,
  opensAt: '2026-10-08T05:00:00Z',
  closesAt: '2026-10-08T07:00:00Z',
})

const withClient = (Story: () => React.ReactNode) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <Story />
  </QueryClientProvider>
)

const names = new Map([
  ['p-iphone', '아이폰 18 Pro'],
  ['p-galaxy', '갤럭시 S27'],
])

const meta = {
  component: ProductCapList,
  tags: ['ai-generated'],
  decorators: [withClient],
  args: {
    products: [product('p-iphone', 5920, 150), product('p-galaxy', 2410, 80)],
    rates: [
      {
        productId: 'p-iphone',
        cap: { value: 150, source: 'DEFAULT' },
        queueLimit: null,
      },
      {
        productId: 'p-galaxy',
        cap: { value: 150, source: 'OPERATIONAL' },
        queueLimit: null,
      },
    ],
    maxCredit: 1500,
    nameOf: (productId: string) => names.get(productId) ?? productId,
    refreshInterval: false,
    loading: false,
    emptyMessage: '대기열에 올라온 상품이 없습니다.',
    admission: { apply: fn(), confirm: fn(), isPending: false, error: null },
  },
} satisfies Meta<typeof ProductCapList>

export default meta
type Story = StoryObj<typeof meta>

/** 상한에 닿은 상품엔 표시가 붙고, 운영값인 상품만 기본값 되돌리기가 보인다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText(/상한에 닿음/)).toBeVisible()
    await expect(
      canvas.getByRole('img', {
        name: /아이폰 18 Pro 입장 상한 150명 중 150명/,
      }),
    ).toBeVisible()
    const resets = canvas.getAllByRole('button', { name: /상한 기본값으로/ })
    await expect(resets).toHaveLength(1)
    await userEvent.click(resets[0])
    await expect(args.admission.confirm).toHaveBeenCalledWith(
      '갤럭시 S27의 입장 상한을 기본값으로 되돌릴까요?',
      expect.any(String),
      '되돌리기',
      expect.any(Function),
    )
  },
}

export const Empty: Story = {
  args: { products: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('대기열에 올라온 상품이 없습니다.'),
    ).toBeVisible()
  },
}

/** 운영값을 못 받았으면 상한 바꾸기를 막는다 */
export const RatesMissing: Story = {
  args: { rates: undefined },
  play: async ({ canvas }) => {
    for (const button of canvas.getAllByRole('button', {
      name: /상한 바꾸기/,
    }))
      await expect(button).toBeDisabled()
  },
}

/** 처음엔 진행 중만 보이고, 칩으로 예정·마감 사전예약을 고른다 */
export const PhaseFilter: Story = {
  args: {
    products: [
      product('p-iphone', 5920, 150),
      { ...product('p-galaxy', 0, 0), phase: 'BEFORE_OPEN' as const },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole('button', { name: /진행 중/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText('아이폰 18 Pro')).toBeVisible()
    await expect(canvas.queryByText('갤럭시 S27')).toBeNull()

    await userEvent.click(canvas.getByRole('button', { name: /예정/ }))
    await expect(canvas.getByText('갤럭시 S27')).toBeVisible()
    await expect(canvas.queryByText('아이폰 18 Pro')).toBeNull()

    await userEvent.click(canvas.getByRole('button', { name: /마감/ }))
    await expect(canvas.getByText('마감인 사전예약이 없어요.')).toBeVisible()
  },
}
