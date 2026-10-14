import { expect, fn, userEvent } from 'storybook/test'

import { CancelReasonForm } from './CancelReasonForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: CancelReasonForm,
  tags: ['ai-generated'],
  args: { onConfirm: fn(), onCancel: fn() },
} satisfies Meta<typeof CancelReasonForm>

export default meta
type Story = StoryObj<typeof meta>

/** 사유가 비면(공백만 있어도) 중지 버튼이 막힌다 — 서버가 400을 준다 */
export const RequiresReason: Story = {
  play: async ({ canvas, args }) => {
    const confirm = canvas.getByRole('button', { name: '판매 중지' })
    await expect(confirm).toBeDisabled()

    const field = canvas.getByRole('textbox', { name: '중지 사유' })
    await userEvent.type(field, '   ')
    await expect(confirm).toBeDisabled()

    await userEvent.type(field, ' 출시 연기 ')
    await userEvent.click(confirm)
    // 앞뒤 공백을 떼고 보낸다.
    await expect(args.onConfirm).toHaveBeenCalledWith('출시 연기')
  },
}

export const Cancel: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '취소' }))
    await expect(args.onCancel).toHaveBeenCalled()
  },
}
