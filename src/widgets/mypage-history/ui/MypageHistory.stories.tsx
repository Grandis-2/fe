import { expect } from 'storybook/test'

import { color } from '@shared/config/theme'

import { MypageHistory } from './MypageHistory'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MypageHistory,
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
} satisfies Meta<typeof MypageHistory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('구매 확정 마감까지')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '구매 확정하기' }),
    ).toBeVisible()
  },
}

export const FilterPreorder: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '사전예약' }))
    // 사전예약 주문 두 건만 남는다 — 일반 구매의 '주문 취소'가 사라진다.
    await expect(canvas.getByText('2건')).toBeVisible()
    await expect(
      canvas.queryByRole('button', { name: '주문 취소' }),
    ).not.toBeInTheDocument()
  },
}
