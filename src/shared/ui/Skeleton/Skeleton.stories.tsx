import { expect } from 'storybook/test'

import { Skeleton } from './Skeleton'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Skeleton,
  tags: ['ai-generated'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

/** 크기를 받아 회색 막대를 그린다 — 스크린리더엔 숨긴다 */
export const Default: Story = {
  args: { width: 240, height: 24 },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('span')
    await expect(bar).toHaveAttribute('aria-hidden', 'true')
    await expect(bar).toHaveStyle({ width: '240px', height: '24px' })
  },
}
