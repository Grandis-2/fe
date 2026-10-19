import { expect } from 'storybook/test'

import { AdminNotification } from './AdminNotification'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminNotification,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminNotification>

export default meta
type Story = StoryObj<typeof meta>

/** 벨을 누르면 빈 알림 패널이 열리고, Esc로 닫히면 포커스가 벨로 돌아온다 */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const bell = canvas.getByRole('button', { name: '알림' })
    await userEvent.click(bell)
    const panel = canvas.getByRole('dialog', { name: '알림' })
    await expect(panel).toHaveTextContent('새 알림이 없어요.')
    await userEvent.keyboard('{Escape}')
    await expect(canvas.queryByRole('dialog')).toBeNull()
    await expect(bell).toHaveFocus()
  },
}
