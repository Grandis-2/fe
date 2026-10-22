import { CountBadge } from './CountBadge'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: CountBadge,
  tags: ['ai-generated'],
  args: { children: '3' },
} satisfies Meta<typeof CountBadge>

export default meta
type Story = StoryObj<typeof meta>

/** 한 자리 — 원 */
export const OneDigit: Story = {}

/** 두 자리부터 — 알약 */
export const TwoDigits: Story = { args: { children: '24' } }

export const ManyDigits: Story = { args: { children: '1,284' } }
