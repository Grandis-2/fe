import { expect } from 'storybook/test'

import { AdminProductStockTable } from './AdminProductStockTable'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminProductStockTable,
  tags: ['ai-generated'],
  args: { productId: '0199c40a-6b1e-7d52-9a3f-2c4e6f8a0b1d' },
} satisfies Meta<typeof AdminProductStockTable>

export default meta
type Story = StoryObj<typeof meta>

/** 상품과 재고를 받는 동안엔 표 자리에 안내가 보인다(Storybook엔 목 서버가 없다) */
export const Loading: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText(/불러오는 중입니다|불러오지 못했습니다/),
    ).toBeVisible()
  },
}
