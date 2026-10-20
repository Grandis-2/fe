import { expect } from 'storybook/test'

import { OrderSummaryCard } from './OrderSummaryCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OrderSummaryCard,
  tags: ['ai-generated'],
  args: {
    orders: {
      AWAITING_CONFIRMATION: 52,
      PREPARING_ITEMS: 24,
      READY_TO_SHIP: 13,
      SHIPPED: 210,
    },
    products: { active: 42, paused: 3 },
  },
} satisfies Meta<typeof OrderSummaryCard>

export default meta
type Story = StoryObj<typeof meta>

/** 단계를 누르면 그 상태로 거른 주문 목록이 열린다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: /24\s*상품 준비 중/ }),
    ).toHaveAttribute('href', '/admin/orders?status=PREPARING_ITEMS')
    await expect(canvas.getByText(/판매 중 42/)).toBeVisible()
  },
}

/** 못 받은 숫자는 0이 아니라 '—' */
export const Unknown: Story = {
  args: {
    orders: {
      AWAITING_CONFIRMATION: null,
      PREPARING_ITEMS: null,
      READY_TO_SHIP: null,
      SHIPPED: null,
    },
    products: { active: null, paused: null },
  },
}
