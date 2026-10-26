import { expect, fn } from 'storybook/test'

import { ConvertToInStockForm } from './ConvertToInStockForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ConvertToInStockForm,
  tags: ['ai-generated'],
  args: {
    variants: [
      { variantId: 'v-256', title: '블랙 / 256GB', status: 'ACTIVE' },
      { variantId: 'v-512', title: '블랙 / 512GB', status: 'PAUSED' },
    ],
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConvertToInStockForm>

export default meta
type Story = StoryObj<typeof meta>

/** 판매 중지 옵션까지 모든 옵션의 재고와 할인율을 보낸다 */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('판매 중지')).toBeVisible()
    const first = canvas.getByLabelText('블랙 / 256GB 재고')
    await userEvent.clear(first)
    await userEvent.type(first, '50')
    await userEvent.click(
      canvas.getByRole('button', { name: '일반 상품으로 전환' }),
    )
    await expect(args.onConfirm).toHaveBeenCalledWith({
      stocks: [
        { variantId: 'v-256', stock: 50 },
        { variantId: 'v-512', stock: 0 },
      ],
      discountRate: 0,
    })
  },
}

/** 재고 칸이 비거나 할인율이 범위 밖이면 막는다 */
export const Invalid: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.clear(canvas.getByLabelText('블랙 / 256GB 재고'))
    const confirm = canvas.getByRole('button', { name: '일반 상품으로 전환' })
    await expect(confirm).toBeDisabled()
    await userEvent.type(canvas.getByLabelText('블랙 / 256GB 재고'), '10')
    const discount = canvas.getByLabelText(/일반 판매 할인율/)
    await userEvent.clear(discount)
    await userEvent.type(discount, '120')
    await expect(confirm).toBeDisabled()
    await expect(args.onConfirm).not.toHaveBeenCalled()
  },
}
