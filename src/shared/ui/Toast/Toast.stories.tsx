import { useState } from 'react'

import { expect, fn, waitFor } from 'storybook/test'

import { Button } from '../Button'

import { ToastViewport, type ToastItem } from './Toast'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ToastViewport,
  tags: ['ai-generated'],
} satisfies Meta<typeof ToastViewport>

export default meta
type Story = StoryObj<typeof meta>

// 앱에서는 toastStore가 목록을 들고 있다 — 스토리에서는 같은 일을 useState로 대신한다.
function ToastDemo({
  message = '링크가 복사되었습니다!',
  duration,
}: {
  message?: string
  duration?: number
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [nextId, setNextId] = useState(1)

  return (
    <>
      <Button
        onClick={() => {
          // toastStore와 같이 하나만 두고 갈아 끼운다.
          setToasts([{ id: nextId, message }])
          setNextId((id) => id + 1)
        }}
      >
        토스트 띄우기
      </Button>
      <ToastViewport
        toasts={toasts}
        duration={duration}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }
      />
    </>
  )
}

export const Default: Story = {
  args: { toasts: [], onDismiss: fn() },
  render: () => <ToastDemo />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '토스트 띄우기' }))
    const toast = await canvas.findByText('링크가 복사되었습니다!')
    // 들어오는 애니메이션(opacity 0 → 1)이 끝나야 visible이다.
    await waitFor(() => expect(toast).toBeVisible())
  },
}

export const DisappearsAfterDuration: Story = {
  args: { toasts: [], onDismiss: fn() },
  // 테스트가 오래 기다리지 않도록 머무는 시간을 줄인다.
  render: () => <ToastDemo duration={300} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '토스트 띄우기' }))
    await canvas.findByText('링크가 복사되었습니다!')
    // 머무는 시간 + 나가는 애니메이션이 끝나면 목록에서 빠진다.
    await waitFor(
      () =>
        expect(
          canvas.queryByText('링크가 복사되었습니다!'),
        ).not.toBeInTheDocument(),
      { timeout: 2000 },
    )
  },
}

export const ReplacesOnRepeat: Story = {
  args: { toasts: [], onDismiss: fn() },
  render: () => <ToastDemo />,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: '토스트 띄우기' })
    await userEvent.click(button)
    await userEvent.click(button)
    await userEvent.click(button)
    // 연달아 눌러도 쌓이지 않고 하나만 남는다.
    await waitFor(() =>
      expect(canvas.getAllByText('링크가 복사되었습니다!')).toHaveLength(1),
    )
  },
}

export const LongMessage: Story = {
  args: {
    toasts: [
      {
        id: 1,
        message:
          '프로모션 링크가 클립보드에 복사되었습니다. 고객에게 보낼 메시지에 붙여 넣어 사용하세요.',
      },
    ],
    // 스토리에서 계속 보이도록 충분히 길게 둔다.
    duration: 60_000,
    onDismiss: fn(),
  },
}
