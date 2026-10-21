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

/**
 * 손댈 단계(상품 준비·출고 대기)는 줄마다 처리 버튼, 결제 완료·배송 중은 아래 알약. 누르면
 * 그 상태로 거른 주문 목록이 열린다.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: '상품 준비 중 주문 처리' }),
    ).toHaveAttribute('href', '/admin/orders?status=PREPARING_ITEMS')
    await expect(
      canvas.getByRole('link', { name: '출고 대기 주문 처리' }),
    ).toHaveAttribute('href', '/admin/orders?status=READY_TO_SHIP')
    await expect(
      canvas.getByRole('link', { name: /배송 중\s*210/ }),
    ).toHaveAttribute('href', '/admin/orders?status=SHIPPED')
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
