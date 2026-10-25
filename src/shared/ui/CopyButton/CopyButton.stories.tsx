import { expect } from 'storybook/test'

import { CopyButton } from './CopyButton'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: CopyButton,
  tags: ['ai-generated'],
  args: { value: '7a1f0c9e-3b2d', label: 'messageId' },
} satisfies Meta<typeof CopyButton>

export default meta
type Story = StoryObj<typeof meta>

/** 아이콘만 — 이름은 스크린리더가 읽는다 */
export const IconOnly: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'messageId 복사' }),
    ).toBeVisible()
  },
}

export const WithLabel: Story = {
  args: { showLabel: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('messageId 복사')).toBeVisible()
  },
}
