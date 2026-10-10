import { expect } from 'storybook/test'

import { color } from '@shared/config/theme'

import { OrderItemList } from './OrderItemList'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OrderItemList,
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ padding: 28, background: color.background.base }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrderItemList>

export default meta
type Story = StoryObj<typeof meta>

const items = [
  {
    variantId: '1',
    productName: '맥북 프로 14',
    optionSummary: '스페이스 블랙 · 512GB',
    quantity: 1,
    unitPrice: 2390000,
  },
  {
    variantId: '2',
    productName: '아이폰 18 Pro',
    optionSummary: '딥 블루 · 256GB',
    quantity: 2,
    unitPrice: 1550000,
  },
  {
    variantId: '3',
    productName: '에어팟 프로 3',
    optionSummary: '화이트',
    quantity: 1,
    unitPrice: 369000,
  },
]

export const Single: Story = {
  args: { items: items.slice(0, 1) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1건')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

export const Multiple: Story = {
  args: { items },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByText('에어팟 프로 3')).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /1개 더보기/ }))
    await expect(canvas.getByText('에어팟 프로 3')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /접기/ })).toBeVisible()
  },
}
