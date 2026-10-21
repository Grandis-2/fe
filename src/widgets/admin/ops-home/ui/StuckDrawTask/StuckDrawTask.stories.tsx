import { expect } from 'storybook/test'

import { StuckDrawTask } from './StuckDrawTask'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: StuckDrawTask,
  tags: ['ai-generated'],
  args: { draw: { drawId: 'draw-1', title: '매직 키보드 블랙 에디션' } },
} satisfies Meta<typeof StuckDrawTask>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/추첨 결과 지연/)).toBeVisible()
    await expect(canvas.getByRole('link', { name: '회차 확인' })).toBeVisible()
  },
}
