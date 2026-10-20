import { expect, fn } from 'storybook/test'

import { AdminBannerForm } from './AdminBannerForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminBannerForm,
  tags: ['ai-generated'],
  args: {
    targets: {
      options: {
        PRODUCT: [{ id: 'p-1', name: 'Nova 1 실리콘 케이스' }],
        PROMOTION: [{ id: 'pr-1', name: '가을 사전예약' }],
      },
      isPending: { PRODUCT: false, PROMOTION: false },
      isError: { PRODUCT: false, PROMOTION: false },
    },
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof AdminBannerForm>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

/** 빈 칸이 있으면 보내지 않고 이유를 보여준다 */
export const BlocksIncomplete: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/배지/), '추천')
    await userEvent.click(canvas.getByRole('button', { name: '만들기' }))
    await expect(args.onSubmit).not.toHaveBeenCalled()
    await expect(
      canvas.getByText('모든 문구 칸을 채워 주세요.'),
    ).toBeInTheDocument()
  },
}

export const TargetsLoading: Story = {
  args: {
    targets: {
      options: { PRODUCT: undefined, PROMOTION: undefined },
      isPending: { PRODUCT: true, PROMOTION: true },
      isError: { PRODUCT: false, PROMOTION: false },
    },
  },
}
