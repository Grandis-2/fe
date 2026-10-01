import { expect, fn } from 'storybook/test'

import { Checkbox } from '@/shared/ui'

import { OrderSummary } from './OrderSummary'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OrderSummary,
  tags: ['ai-generated'],
} satisfies Meta<typeof OrderSummary>

export default meta
type Story = StoryObj<typeof meta>

const base = {
  rows: [
    { label: '상품 금액', value: '2,278,100원' },
    { label: '할인 금액', value: '-100,000원', highlight: true },
    { label: '배송비', value: '무료' },
  ],
  totalValue: '2,178,100원',
  actionLabel: '결제하기',
  onAction: fn(),
}

export const Cart: Story = {
  args: base,
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '결제하기' }))
    await expect(args.onAction).toHaveBeenCalledOnce()
  },
}

// 결제 페이지에서는 약관 동의(features/terms-agreement 예정)가 children으로 들어간다.
export const WithChildren: Story = {
  args: {
    ...base,
    children: (
      <label>
        <Checkbox checked readOnly />
        약관에 모두 동의합니다
      </label>
    ),
  },
}

export const ActionDisabled: Story = {
  args: { ...base, actionDisabled: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '결제하기' }),
    ).toBeDisabled()
  },
}
