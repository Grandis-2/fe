import { expect, fn } from 'storybook/test'

import { OpenPreorderPicker } from './OpenPreorderPicker'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OpenPreorderPicker,
  tags: ['ai-generated'],
  args: {
    items: [
      { productId: 'p-iphone', name: '아이폰 18 Pro' },
      { productId: 'p-fold', name: '갤럭시 Z 폴드8' },
    ],
    selected: null,
    onSelect: fn(),
  },
} satisfies Meta<typeof OpenPreorderPicker>

export default meta
type Story = StoryObj<typeof meta>

/** 처음엔 전체가 눌려 있고, 사전예약을 누르면 그 id로 고른다 */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(
      canvas.getByRole('button', { name: '갤럭시 Z 폴드8' }),
    )
    await expect(args.onSelect).toHaveBeenCalledWith('p-fold')
  },
}

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('지금 접수 중인 사전예약이 없어요.'),
    ).toBeVisible()
  },
}
