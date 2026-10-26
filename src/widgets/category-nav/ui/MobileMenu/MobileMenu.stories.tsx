import { expect, fn, waitFor } from 'storybook/test'

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
    // 열 때 투명(opacity 0)에서 나타나는 애니메이션이 있어 다 보일 때까지 기다린다.
    await waitFor(() =>
      expect(canvas.getByRole('link', { name: /스마트폰/ })).toBeVisible(),
    )

    const lucky = canvas.getByRole('tab', { name: 'LUCKY' })
    await userEvent.click(lucky)
    await expect(lucky).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.queryByRole('link', { name: /스마트폰/ })).toBeNull()

    await userEvent.click(canvas.getByRole('button', { name: '메뉴 닫기' }))
    await expect(args.onClose).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).toHaveBeenCalledTimes(2)
  },
}
