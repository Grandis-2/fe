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

// 닫는 길마다 스토리를 따로 둔다 — 한 스토리에 몰면 어느 경로가 깨졌는지 안 보이고,
// 하나가 실패하면 뒤따르는 경로는 아예 검증되지 않는다.
const openModal = async (
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
  userEvent: Parameters<NonNullable<Story['play']>>[0]['userEvent'],
) => {
  await userEvent.click(canvas.getByRole('button', { name: '모달 열기' }))
  const dialog = await canvas.findByRole('dialog')
  await waitFor(() => expect(dialog).toBeVisible())
  return dialog
}

const expectClosed = (
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
) => waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument())

export const ClosesByCloseButton: Story = {
  args: { open: false, onClose: fn(), children: null },
  render: () => <OpenableModal />,
  play: async ({ canvas, userEvent }) => {
    await openModal(canvas, userEvent)
    await userEvent.click(canvas.getByRole('button', { name: '닫기' }))
    await expectClosed(canvas)
  },
}

export const ClosesByBackdrop: Story = {
  args: { open: false, onClose: fn(), children: null },
  render: () => <OpenableModal />,
  play: async ({ canvas, userEvent }) => {
    const dialog = await openModal(canvas, userEvent)
    // Modal은 event.target === dialog 자신인지로 backdrop을 판단하므로,
    // 좌표 기반 클릭 대신 dialog에 직접 이벤트를 보낸다.
    await fireEvent.click(dialog)
    await expectClosed(canvas)
  },
}

/**
 * Escape처럼 브라우저가 직접 닫는 경로.
 *
 * 실제 Escape 키는 여기서 검증할 수 없다 — Vitest browser mode(iframe) 안에서는
 * userEvent.keyboard('{Escape}')를 보내도 <dialog>의 UA 기본 동작이 걸리지 않는다.
 * dialog 안(닫기 버튼)으로 포커스를 옮기고 보내도 dialog.open이 true로 남는 걸
 * 확인했다. Modal.tsx에는 Escape를 막는 코드가 없으므로 실제 브라우저에서는 동작한다.
 *
 * 그래서 키 입력 대신 close()로 같은 상황을 만들고, 우리가 책임지는 부분만 검증한다 —
 * 네이티브로 닫혔을 때 React 상태가 따라오는가. 상태가 안 따라오면 open이 true로 남아,
 * 다시 열기를 눌러도 setOpen(true)가 변화를 만들지 못해 effect가 안 돌고 모달이
 * 영영 안 열린다.
 */
export const SyncsWithNativeClose: Story = {
  args: { open: false, onClose: fn(), children: null },
  render: () => <OpenableModal />,
  play: async ({ canvas, userEvent }) => {
    const dialog = (await openModal(canvas, userEvent)) as HTMLDialogElement
    dialog.close()
    await expectClosed(canvas)

    // 다시 열린다면 React 상태가 네이티브 닫힘을 따라왔다는 뜻이다.
    await openModal(canvas, userEvent)
  },
}
