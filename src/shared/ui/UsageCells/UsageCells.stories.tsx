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

/** 1칸 = 1. 채운 칸이 쓰는 양 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: '입장 상한 20명 중 12명 사용' }),
    ).toBeVisible()
  },
}

/** 다 쓰면 경고 색 */
export const Full: Story = { args: { used: 6, total: 6 } }

/** 전체가 크면 칸을 묶는다 — 100이면 1칸 = 5 */
export const Grouped: Story = { args: { used: 45, total: 100 } }

/** 전체 0 — 빈 테두리 */
export const Zero: Story = { args: { used: 0, total: 0 } }
