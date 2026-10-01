import { expect, fn } from 'storybook/test'

import { Header } from './Header'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Header,
  tags: ['ai-generated'],
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Guest: Story = {
  args: { isMember: false, onSearchClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '검색' }))
    await expect(args.onSearchClick).toHaveBeenCalledOnce()
  },
}

export const Member: Story = {
  args: { isMember: true },
}

// 회원으로 들어가도 어드민 헤더는 알림 하나만 남는다.
export const Admin: Story = {
  args: { isMember: true },
  parameters: { initialEntries: ['/admin/products'] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'NOVA ADMIN' }),
    ).toHaveAttribute('href', '/admin')
    await expect(canvas.queryByRole('link', { name: '모바일' })).toBeNull()

    const buttons = canvas.getAllByRole('button')
    await expect(buttons).toHaveLength(1)
    await expect(buttons[0]).toHaveAccessibleName('알림')
  },
}
