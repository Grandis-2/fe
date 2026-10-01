import { expect, fn } from 'storybook/test'

import placeholderImage from '@/shared/assets/react.svg'

import { ProductPaymentCard } from './ProductPaymentCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ProductPaymentCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof ProductPaymentCard>

export default meta
type Story = StoryObj<typeof meta>

const product = {
  imageSrc: placeholderImage,
  productId: '1',
  name: 'NOVA Phone',
  modelNumber: 'NV-2026',
  optionSummary: '미드나이트 · 256GB · AppleCare+ 포함',
  quantityLabel: '수량 1개',
  priceLabel: '1,290,000원',
}

export const Default: Story = {
  args: { product, variant: 'default' },
}

export const PreorderPending: Story = {
  args: { product, variant: 'preorder-pending', actionLabel: '예약 대기중' },
}

export const Checkout: Story = {
  args: {
    product,
    variant: 'checkout',
    actionLabel: '결제하기',
    onActionClick: fn(),
  },
  play: async ({ canvas, args }) => {
    await canvas.getByRole('button', { name: '결제하기' }).click()
    await expect(args.onActionClick).toHaveBeenCalledOnce()
  },
}

export const Cart: Story = {
  args: {
    product,
    variant: 'cart',
    checked: false,
    onCheckedChange: fn(),
    onRemove: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('checkbox'))
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true)

    await userEvent.click(canvas.getByRole('button', { name: /삭제/ }))
    await expect(args.onRemove).toHaveBeenCalledOnce()
  },
}
