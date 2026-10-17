import { expect, fn, userEvent } from 'storybook/test'

import { ReservationNoteForm } from './ReservationNoteForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReservationNoteForm,
  tags: ['ai-generated'],
  args: { value: null, maxLength: 1000, onSave: fn() },
} satisfies Meta<typeof ReservationNoteForm>

export default meta
type Story = StoryObj<typeof meta>

/** 바뀐 게 없으면 저장을 막고, 앞뒤 공백을 떼고 보낸다 */
export const Empty: Story = {
  play: async ({ canvas, args }) => {
    const save = canvas.getByRole('button', { name: '메모 저장' })
    await expect(save).toBeDisabled()
    await userEvent.type(
      canvas.getByRole('textbox', { name: '내부 메모' }),
      '  VIP 고객 ',
    )
    await userEvent.click(save)
    await expect(args.onSave).toHaveBeenCalledWith('VIP 고객')
  },
}

/** 다 지우면 메모를 지우는 요청(null)을 보낸다 */
export const ClearExisting: Story = {
  args: { value: 'VIP 고객' },
  play: async ({ canvas, args }) => {
    await userEvent.clear(canvas.getByRole('textbox', { name: '내부 메모' }))
    await userEvent.click(canvas.getByRole('button', { name: '메모 저장' }))
    await expect(args.onSave).toHaveBeenCalledWith(null)
  },
}

export const Saving: Story = {
  args: { value: 'VIP 고객', saving: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '저장 중…' }),
    ).toBeDisabled()
  },
}
