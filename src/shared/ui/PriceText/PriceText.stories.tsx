import { expect } from 'storybook/test'

import { PriceText } from './PriceText'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PriceText,
  tags: ['ai-generated'],
} satisfies Meta<typeof PriceText>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: '2,278,100원' },
  play: async ({ canvas }) => {
    const unit = canvas.getByText('원')
    await expect(unit).toBeInTheDocument()
    // 단위는 금액보다 작게 — 부모 크기에 비례해 줄어든다.
    await expect(getComputedStyle(unit).fontSize).not.toBe(
      getComputedStyle(unit.parentElement!).fontSize,
    )
  },
}

// 단위가 없는 값은 그대로 둔다(무료 배송 등).
export const WithoutUnit: Story = {
  args: { value: '무료' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('무료')).toBeInTheDocument()
    await expect(canvas.queryByText('원')).not.toBeInTheDocument()
  },
}
