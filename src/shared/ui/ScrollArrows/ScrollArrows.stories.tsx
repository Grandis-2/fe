import { expect, fn } from 'storybook/test'

import { ScrollArrows } from './ScrollArrows'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ScrollArrows,
  tags: ['ai-generated'],
  args: { onPage: fn() },
  parameters: { backgrounds: { default: 'dark' } },
} satisfies Meta<typeof ScrollArrows>

export default meta
type Story = StoryObj<typeof meta>

// 맨 앞 — 이전 버튼은 꺼지고 다음만 눌린다.
export const AtStart: Story = {
  args: { canPrev: false, canNext: true },
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByLabelText('이전 상품')).toBeDisabled()
    await userEvent.click(canvas.getByLabelText('다음 상품'))
    await expect(args.onPage).toHaveBeenCalledWith(1)
  },
}

export const Middle: Story = {
  args: { canPrev: true, canNext: true },
}
