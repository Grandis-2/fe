import { expect, fn } from 'storybook/test'

import { DeleteProductForm } from './DeleteProductForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: DeleteProductForm,
  tags: ['ai-generated'],
  args: { name: '갤럭시 Z 폴드8', onConfirm: fn(), onCancel: fn() },
} satisfies Meta<typeof DeleteProductForm>

export default meta
type Story = StoryObj<typeof meta>

/** 이름을 그대로 입력해야 지우기가 열린다 */
export const TypeNameToDelete: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const confirm = canvas.getByRole('button', { name: '상품 삭제' })
    await expect(confirm).toBeDisabled()
    await userEvent.type(canvas.getByRole('textbox'), '갤럭시 Z 폴드')
    await expect(confirm).toBeDisabled()
    await userEvent.type(canvas.getByRole('textbox'), '8')
    await expect(confirm).toBeEnabled()
    await userEvent.click(confirm)
    await expect(args.onConfirm).toHaveBeenCalledOnce()
  },
}
