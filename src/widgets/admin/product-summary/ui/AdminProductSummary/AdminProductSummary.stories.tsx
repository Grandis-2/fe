import { expect } from 'storybook/test'

import { AdminProductSummary } from './AdminProductSummary'

import type { AdminProductSummaryProps } from './AdminProductSummary'
import type { Meta, StoryObj } from '@storybook/react-vite'

type Product = AdminProductSummaryProps['product']

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const variant = (
  variantId: string,
  price: number,
  status: 'ACTIVE' | 'PAUSED' = 'ACTIVE',
): Product['variants'][number] => ({
  variantId,
  sku: variantId,
  title: variantId,
  selections: {},
  filterAttributes: {},
  price,
  listPrice: Math.round(price / 0.9),
  status,
  availableQuantity: null,
})

const preorder: Product = {
  productId: 'SM-FOLD8',
  saleMode: 'PREORDER',
  discountRate: 10,
  displayStatus: 'SCHEDULED',
  optionAxes: [],
  variants: [
    variant('256', 2_151_000),
    variant('512', 2_331_000),
    variant('1tb', 2_601_000, 'PAUSED'),
  ],
  campaign: {
    status: 'BEFORE_OPEN',
    // 렌더까지 몇 ms가 지나도 '2일'로 읽히게 한 시간 여유를 둔다.
    opensAt: new Date(Date.now() + 2 * DAY + HOUR).toISOString(),
    closesAt: new Date(Date.now() + 5 * DAY).toISOString(),
  },
}

const meta = {
  component: AdminProductSummary,
  tags: ['ai-generated'],
  args: { product: preorder },
} satisfies Meta<typeof AdminProductSummary>

export default meta
type Story = StoryObj<typeof meta>

/** 오픈 전 사전예약 — 판매 중인 옵션의 최저가와 오픈까지 남은 시간을 보여준다 */
export const BeforeOpen: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('2,151,000원~')).toBeVisible()
    await expect(canvas.getByText('판매 중지 1종')).toBeVisible()
    await expect(canvas.getByText(/오픈까지 2일/)).toBeVisible()
    await expect(canvas.getByText('오픈 전이라 바꿀 수 있어요')).toBeVisible()
  },
}

/** 일반 상품 — 뒤의 두 칸이 남은 수량·전시로 바뀐다(Storybook엔 목 서버가 없어 재고는 실패로 보인다) */
export const InStock: Story = {
  args: {
    product: {
      ...preorder,
      saleMode: 'IN_STOCK',
      displayStatus: 'PUBLISHED',
      campaign: null,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('남은 수량')).toBeVisible()
    await expect(canvas.getByText('구매자 목록에 보여요')).toBeVisible()
  },
}
