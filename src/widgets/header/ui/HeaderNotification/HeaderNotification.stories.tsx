import { expect } from 'storybook/test'

import { HeaderNotification } from './HeaderNotification'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: HeaderNotification,
  tags: ['ai-generated'],
  args: { label: '알림 5개', badge: null },
} satisfies Meta<typeof HeaderNotification>

export default meta
type Story = StoryObj<typeof meta>

// 벨을 누를 때마다 패널이 열리고 닫힌다. Esc로도 닫히고 포커스는 벨로 돌아온다.
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const bell = canvas.getByRole('button', { name: '알림 5개' })

    await userEvent.click(bell)
    await expect(canvas.getByRole('dialog', { name: '알림' })).toBeVisible()
    await expect(bell).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(bell)
    await expect(canvas.queryByRole('dialog')).toBeNull()

    await userEvent.click(bell)
    await userEvent.keyboard('{Escape}')
    await expect(canvas.queryByRole('dialog')).toBeNull()
    await expect(bell).toHaveFocus()
  },
}
