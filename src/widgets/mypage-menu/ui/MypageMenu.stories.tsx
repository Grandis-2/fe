import { expect, fn } from 'storybook/test'

import { color } from '@shared/config/theme'

import { MypageMenu } from './MypageMenu'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MypageMenu,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ padding: 28, background: color.background.page }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MypageMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    userName: '김노바',
    email: 'nova@example.com',
    activeLink: 'history',
    onLinkClick: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await expect(
      canvas.getByRole('button', { name: '주문 내역' }),
    ).toHaveAttribute('aria-current', 'page')
    await userEvent.click(canvas.getByRole('button', { name: '예약 내역' }))
    await expect(args.onLinkClick).toHaveBeenCalledWith('preorder-check')
  },
}

export const AddressActive: Story = {
  args: { userName: '김노바', activeLink: 'address-manage' },
}
