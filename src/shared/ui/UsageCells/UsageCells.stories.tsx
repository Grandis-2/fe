import { expect } from 'storybook/test'

import { UsageCells } from './UsageCells'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: UsageCells,
  tags: ['ai-generated'],
  args: { used: 12, total: 20, label: '입장 상한 20명 중 12명 사용' },
} satisfies Meta<typeof UsageCells>

export default meta
type Story = StoryObj<typeof meta>

/** 칸은 늘 10개 — 쓴 비율만큼 채운다(20명 중 12명이면 6칸) */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: '입장 상한 20명 중 12명 사용' }),
    ).toBeVisible()
  },
}

/** 다 쓰면 경고 색 */
export const Full: Story = { args: { used: 6, total: 6 } }

/** 전체가 커도 칸 수는 같다 — 150명 중 45명이면 3칸 */
export const Large: Story = { args: { used: 45, total: 150 } }

/** 전체 0 — 빈 테두리 */
export const Zero: Story = { args: { used: 0, total: 0 } }
