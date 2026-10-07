import { expect, fn } from 'storybook/test'

import { AdminProductHideDialog } from './AdminProductHideDialog'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminProductHideDialog,
  tags: ['ai-generated'],
  args: { productName: '갤럭시 Z 폴드8', onConfirm: fn(), onCancel: fn() },
} satisfies Meta<typeof AdminProductHideDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/갤럭시 Z 폴드8/)).toBeVisible()
    // 아직 아무것도 안 했는데 경고부터 띄우지 않는다.
    await expect(canvas.queryByText(/5자 이상/)).not.toBeInTheDocument()
  },
}

/** 서버가 5자 이상을 요구한다 — 모자라면 보내지 않고 화면에서 막는다 */
export const RejectsShortReason: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.type(canvas.getByRole('textbox'), '재고')
    await userEvent.click(canvas.getByRole('button', { name: '숨기기' }))

    await expect(canvas.getByText(/5자 이상/)).toBeVisible()
    await expect(args.onConfirm).not.toHaveBeenCalled()
  },
}

/** 5자를 넘기면 앞뒤 공백을 걷어낸 사유로 넘긴다 */
export const SubmitsTrimmedReason: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.type(canvas.getByRole('textbox'), '  재고 소진  ')
    await userEvent.click(canvas.getByRole('button', { name: '숨기기' }))

    await expect(args.onConfirm).toHaveBeenCalledWith('재고 소진')
  },
}
