import { expect, fn } from 'storybook/test'

import { AdminProductEditForm } from './AdminProductEditForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminProductEditForm,
  tags: ['ai-generated'],
  args: {
    productId: '0199c40a-6b1e-7d52-9a3f-2c4e6f8a0b1d',
    onCancel: fn(),
    onPreview: fn(),
  },
} satisfies Meta<typeof AdminProductEditForm>

export default meta
type Story = StoryObj<typeof meta>

/** 상품을 받기 전엔 폼 대신 안내만 보인다(Storybook엔 목 서버가 없다) */
export const Loading: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText(/불러오는 중입니다|불러오지 못했습니다/),
    ).toBeVisible()
  },
}
