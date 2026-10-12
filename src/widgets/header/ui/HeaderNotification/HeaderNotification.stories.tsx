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
  play: async ({ canvas, canvasElement, userEvent }) => {
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

    // 패널 바깥을 누르면 닫힌다.
    await userEvent.click(bell)
    await userEvent.click(canvasElement.ownerDocument.body)
    await expect(canvas.queryByRole('dialog')).toBeNull()
  },
}

// Storybook엔 MSW가 없어 목록 조회가 실패한다 — 실패 문구가 패널 안에 보인다.
export const LoadError: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '알림 5개' }))
    await expect(
      await canvas.findByText(
        '알림을 불러오지 못했어요.',
        {},
        { timeout: 10_000 },
      ),
    ).toBeVisible()
  },
}
