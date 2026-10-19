import { expect } from 'storybook/test'

import { PreorderQueueCard } from './PreorderQueueCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PreorderQueueCard,
  tags: ['ai-generated'],
  args: {
    queue: { runtime: 'QUEUEING', waiting: 1497, credit: 37, cap: 150 },
    rate: { cap: { value: 80, source: 'OPERATIONAL' }, queueLimit: 24_000 },
  },
} satisfies Meta<typeof PreorderQueueCard>

export default meta
type Story = StoryObj<typeof meta>

/** 지금 줄·입장 속도와 그 속도를 정하는 설정을 함께 보인다 */
export const Queueing: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1,497명')).toBeVisible()
    await expect(canvas.getByText('37명')).toBeVisible()
    // 1,497명 ÷ 초당 37명 ≈ 41초
    await expect(canvas.getByText('41초')).toBeVisible()
    await expect(canvas.getByText('초당 80명 · 운영값')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: '대기열 관리에서 바꾸기' }),
    ).toHaveAttribute('href', '/admin/waitingroom')
  },
}

/** 운영값을 아직 못 받았으면 현황의 상한을 보이고 출처는 빼며, 줄이 없으면 그렇다고 한다 */
export const NoQueue: Story = {
  args: {
    queue: { runtime: 'IDLE', waiting: 0, credit: 0, cap: 150 },
    rate: undefined,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('줄 없음', { selector: 'dd' })).toBeVisible()
    await expect(canvas.getByText('초당 150명')).toBeVisible()
    await expect(canvas.getByText('제한 없음')).toBeVisible()
  },
}
