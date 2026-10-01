import { expect, fn } from 'storybook/test'

import { ConfirmDialog } from './ConfirmDialog'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ConfirmDialog,
  tags: ['ai-generated'],
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

// 모달 껍데기 없이 내용만 렌더링한다 — 실제로는
// useModalStore.open(<ConfirmDialog ... />)로 띄운다.
export const Default: Story = {
  args: {
    title: '안내',
    description:
      '현재 새 사전예약 상품이 없습니다.\n먼저 만들고 사전예약 안내 탭을 생성할 수 있습니다.\n\n사전예약 상품을 생성하러 가시겠습니까?',
    confirmLabel: '생성 하러 하기',
    onConfirm: fn(),
    onCancel: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText('안내')).toBeVisible()

    await userEvent.click(
      canvas.getByRole('button', { name: '생성 하러 하기' }),
    )
    await expect(args.onConfirm).toHaveBeenCalledTimes(1)

    await userEvent.click(canvas.getByRole('button', { name: '취소' }))
    await expect(args.onCancel).toHaveBeenCalledTimes(1)
  },
}

export const TitleOnly: Story = {
  args: { title: '삭제할까요?', onConfirm: fn(), onCancel: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '확인' })).toBeVisible()
  },
}
