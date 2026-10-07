import { expect } from 'storybook/test'

import { PurchaseDeadline } from './PurchaseDeadline'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PurchaseDeadline,
  tags: ['ai-generated'],
} satisfies Meta<typeof PurchaseDeadline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  play: async ({ canvas }) => {
    // 24시간 남았으면 days=1로 쪼개지지 않고 "24:00:00" 근처로 보여야 한다.
    await expect(canvas.getByText(/^2[34]:\d{2}:\d{2}$/)).toBeVisible()
  },
}
