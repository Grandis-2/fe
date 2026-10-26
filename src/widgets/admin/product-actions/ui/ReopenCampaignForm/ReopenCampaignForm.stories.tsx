import { expect, fn } from 'storybook/test'

import { ReopenCampaignForm } from './ReopenCampaignForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReopenCampaignForm,
  tags: ['ai-generated'],
  args: { onConfirm: fn(), onCancel: fn() },
} satisfies Meta<typeof ReopenCampaignForm>

export default meta
type Story = StoryObj<typeof meta>

/** 처음엔 한 시간 뒤로 채워져 있어 바로 다시 열 수 있다 */
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '다시 열기' }))
    await expect(args.onConfirm).toHaveBeenCalledOnce()
    const [closesAt] = (args.onConfirm as ReturnType<typeof fn>).mock
      .calls[0] as [string]
    await expect(Date.parse(closesAt)).toBeGreaterThan(Date.now())
  },
}

/** 지난 시각이면 이유를 적고 확인을 막는다 */
export const PastTime: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByLabelText(/새 마감 시각/)
    await userEvent.clear(input)
    await userEvent.type(input, '2020-01-01T09:00')
    await expect(canvas.getByText('지금보다 뒤로 정해 주세요.')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '다시 열기' }),
    ).toBeDisabled()
    await expect(args.onConfirm).not.toHaveBeenCalled()
  },
}
