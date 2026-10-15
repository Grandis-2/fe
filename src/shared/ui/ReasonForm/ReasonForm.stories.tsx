import { expect, fn, userEvent } from 'storybook/test'

import { ReasonForm } from './ReasonForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReasonForm,
  tags: ['ai-generated'],
  args: {
    label: '중지 사유',
    confirmLabel: '판매 중지',
    maxLength: 500,
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ReasonForm>

export default meta
type Story = StoryObj<typeof meta>

/** 사유가 비면(공백만 있어도) 확인 버튼이 막힌다 — 서버가 400을 준다 */
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

/** 최소 글자 수가 있으면 채울 때까지 막고, 몇 자가 필요한지 알려준다 */
export const MinLength: Story = {
  args: { label: '취소 사유', confirmLabel: '예약 취소', minLength: 5 },
  play: async ({ canvas, args }) => {
    const confirm = canvas.getByRole('button', { name: '예약 취소' })
    const field = canvas.getByRole('textbox', { name: '취소 사유' })
    await userEvent.type(field, '고객')
    await expect(confirm).toBeDisabled()
    await expect(canvas.getByText(/5자 이상/)).toBeVisible()

    await userEvent.type(field, ' 요청 취소')
    await userEvent.click(confirm)
    await expect(args.onConfirm).toHaveBeenCalledWith('고객 요청 취소')
  },
}

export const Cancel: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: '취소' }))
    await expect(args.onCancel).toHaveBeenCalled()
  },
}
