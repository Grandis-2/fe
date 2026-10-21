import { useState } from 'react'

import { expect } from 'storybook/test'

import { NotificationPopover } from './NotificationPopover'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: NotificationPopover,
  tags: ['ai-generated'],
  args: {
    label: '알림 3개',
    open: false,
    onOpenChange: () => {},
    theme: 'light',
    children: <div>패널 내용</div>,
  },
  // 열림은 호출부가 쥔다 — 스토리에서 상태를 들고 넘긴다.
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return <NotificationPopover {...args} open={open} onOpenChange={setOpen} />
  },
} satisfies Meta<typeof NotificationPopover>

export default meta
type Story = StoryObj<typeof meta>

/** 벨로 여닫고, 바깥을 누르면 닫힌다 */
export const Toggle: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const bell = canvas.getByRole('button', { name: '알림 3개' })
    await userEvent.click(bell)
    await expect(canvas.getByText('패널 내용')).toBeVisible()
    await expect(bell).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(canvasElement.ownerDocument.body)
    await expect(canvas.queryByRole('dialog')).toBeNull()
  },
}

/** 제목 줄 오른쪽에 동작을 붙일 수 있다 */
export const WithTitleAction: Story = {
  args: { titleAction: <button type="button">모두 읽음</button> },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '알림 3개' }))
    await expect(
      canvas.getByRole('button', { name: '모두 읽음' }),
    ).toBeVisible()
  },
}
