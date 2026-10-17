import { expect } from 'storybook/test'

import { AdminWaitingroom } from './AdminWaitingroom'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminWaitingroom,
  tags: ['ai-generated'],
  args: { productNames: new Map() },
} satisfies Meta<typeof AdminWaitingroom>

export default meta
type Story = StoryObj<typeof meta>

/** 현황 카드와 운영값·상품별 섹션이 나온다(숫자는 서버 응답 뒤에 채워진다) */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('총 대기 인원')).toBeVisible()
    await expect(canvas.getByText('운영값')).toBeVisible()
    await expect(canvas.getByText('상품별 대기열')).toBeVisible()
  },
}
