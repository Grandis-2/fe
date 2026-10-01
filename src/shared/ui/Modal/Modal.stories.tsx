import { useState } from 'react'

import { expect, fireEvent, fn, waitFor } from 'storybook/test'

import { Button } from '../Button'

import { Modal } from './Modal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Modal,
  tags: ['ai-generated'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

// open은 컨트롤된 prop이라, 트리거 버튼으로 여는 쪽을 스토리에서 직접 만든다.
function OpenableModal() {
  const [open, setOpen] = useState(false)
  const onClose = fn(() => setOpen(false))

  return (
    <>
      <Button onClick={() => setOpen(true)}>모달 열기</Button>
      <Modal open={open} onClose={onClose}>
        <div>모달 내용</div>
      </Modal>
    </>
  )
}

export const Default: Story = {
  // open은 OpenableModal이 자체 상태로 관리한다 — args는 필수 prop 타입을
  // 맞추기 위한 자리만 채운다.
  args: { open: false, onClose: fn(), children: null },
  render: () => <OpenableModal />,
  play: async ({ canvas, userEvent }) => {
    // 처음엔 닫혀 있다 — 닫힌 dialog는 display:none이라 role 자체가 안 잡힌다.
    expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: '모달 열기' }))
    const content = await canvas.findByText('모달 내용')
    // 열리는 애니메이션(opacity 0 → 1) 도중엔 아직 not visible이다 — 끝날 때까지 기다린다.
    await waitFor(() => expect(content).toBeVisible())
  },
}

export const ClosesThroughAllPaths: Story = {
  args: { open: false, onClose: fn(), children: null },
  render: () => <OpenableModal />,
  play: async ({ canvas, userEvent }) => {
    const open = () =>
      userEvent.click(canvas.getByRole('button', { name: '모달 열기' }))
    const expectClosed = () =>
      waitFor(() =>
        expect(canvas.queryByRole('dialog')).not.toBeInTheDocument(),
      )

    // 닫기(X) 버튼
    await open()
    let dialog = await canvas.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: '닫기' }))
    await expectClosed()

    // backdrop 클릭 — Modal은 event.target === dialog 자신인지로 판단하므로,
    // 실제 좌표 기반 클릭(userEvent) 대신 dialog에 직접 이벤트를 보낸다.
    await open()
    dialog = await canvas.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())
    await fireEvent.click(dialog)
    await expectClosed()

    // Escape — 네이티브 <dialog>가 showModal()로 열려 있으면 브라우저가 처리한다.
    await open()
    dialog = await canvas.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())
    await userEvent.keyboard('{Escape}')
    await expectClosed()
  },
}
