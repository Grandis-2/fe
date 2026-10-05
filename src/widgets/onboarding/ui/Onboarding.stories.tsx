import { fn } from 'storybook/test'

import { Onboarding } from './Onboarding'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Onboarding,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  args: { onFinish: fn() },
} satisfies Meta<typeof Onboarding>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
