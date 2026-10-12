import { expect, fn } from 'storybook/test'

import { MobileMenu } from './MobileMenu'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MobileMenu,
  tags: ['ai-generated'],
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: { onClose: fn() },
} satisfies Meta<typeof MobileMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole('link', { name: /스마트폰/ })).toBeVisible()

    await userEvent.click(canvas.getByRole('tab', { name: '이벤트' }))
    await expect(
      canvas.getByText('아이폰 18 Pro, Pro Max 사전예약 오픈'),
    ).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: '메뉴 닫기' }))
    await expect(args.onClose).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).toHaveBeenCalledTimes(2)
  },
}
