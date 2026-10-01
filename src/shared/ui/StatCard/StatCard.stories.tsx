import { expect } from 'storybook/test'

import { StatCard } from './StatCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: StatCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '확정', value: '3,860건' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('확정')).toBeVisible()
    await expect(canvas.getByText('3,860건')).toHaveStyle({
      color: 'rgb(26, 26, 29)', // text.primary
    })
  },
}

export const Zero: Story = {
  args: { label: '확정 실패', value: '0건' },
}

/** 집계 조회가 실패했을 때 — 0건으로 보이면 안 되므로 흐린 문구로 구분한다 */
export const Unknown: Story = {
  args: { label: '확정 실패', value: '조회 실패', muted: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('조회 실패')).toHaveStyle({
      color: 'rgb(143, 143, 148)', // text.tertiary
    })
  },
}
