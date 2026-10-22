import { expect, fn } from 'storybook/test'

import { ReprocessBanner } from './ReprocessBanner'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReprocessBanner,
  tags: ['ai-generated'],
  args: { sent: 448, target: 860, remainingSeconds: 20, onOpen: fn() },
} satisfies Meta<typeof ReprocessBanner>

export default meta
type Story = StoryObj<typeof meta>

/** 모달을 닫은 채 진행 중 — 진행 보기로 모달을 다시 연다 */
export const Running: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByText('448 / 860건 · 약 20초 남음')).toBeVisible()
    await canvas.getByRole('button', { name: '진행 보기' }).click()
    await expect(args.onOpen).toHaveBeenCalled()
  },
}

/** 예상 시간이 지나 결과 집계를 기다리는 중 */
export const Checking: Story = { args: { sent: 860, remainingSeconds: 0 } }
