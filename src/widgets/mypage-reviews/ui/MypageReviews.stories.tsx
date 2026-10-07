import { expect } from 'storybook/test'

import { color } from '@shared/config/theme'

import { MypageReviews } from './MypageReviews'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MypageReviews,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{ padding: 28, background: color.background.page }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MypageReviews>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /작성 완료/ }))
    // 작성 완료만 보면 리뷰 쓰기 버튼이 없다.
    await expect(
      canvas.queryByRole('button', { name: '리뷰 쓰기' }),
    ).not.toBeInTheDocument()
    await expect(
      canvas.getAllByRole('button', { name: '리뷰 수정' }).length,
    ).toBeGreaterThan(0)
  },
}
