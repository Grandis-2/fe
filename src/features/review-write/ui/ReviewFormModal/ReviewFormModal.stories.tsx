import { expect, fn } from 'storybook/test'

import { color } from '@shared/config/theme'

import { ReviewFormModal } from './ReviewFormModal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReviewFormModal,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ background: color.background.page }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewFormModal>

export default meta
type Story = StoryObj<typeof meta>

export const Write: Story = {
  args: {
    open: true,
    target: {
      orderItemId: '50000000-0000-4000-8000-000000000003',
      productName: '애플 펜슬 프로',
      optionSummary: '화이트',
    },
    onClose: fn(),
  },
  play: async ({ canvas, userEvent }) => {
    const submit = canvas.getByRole('button', { name: '리뷰 등록하기' })
    // 별점과 10자 이상 글이 있어야 등록할 수 있다.
    await expect(submit).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: '4점' }))
    await userEvent.type(
      canvas.getByRole('textbox', { name: '리뷰 내용' }),
      '필기감이 정말 좋아요.',
    )
    await expect(submit).toBeEnabled()
  },
}
