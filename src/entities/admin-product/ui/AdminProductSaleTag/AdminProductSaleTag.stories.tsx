import { expect } from 'storybook/test'

import { AdminProductSaleTag } from './AdminProductSaleTag'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Tag는 widthOptions로 너비를 맞추려고 같은 글자를 aria-hidden ghost로 한 번 더 그린다.
// 눈에 보이는 쪽은 언제나 첫 번째다.
const visibleLabel = (
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
  text: string,
) => canvas.getAllByText(text)[0]

const meta = {
  component: AdminProductSaleTag,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminProductSaleTag>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: { status: 'OPEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '판매 중')).toBeVisible()
  },
}

export const BeforeOpen: Story = {
  args: { status: 'BEFORE_OPEN' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '판매 예정')).toBeVisible()
  },
}

export const Closed: Story = {
  args: { status: 'CLOSED' },
  play: async ({ canvas }) => {
    await expect(visibleLabel(canvas, '판매 종료')).toBeVisible()
  },
}
