import { AdminLoginIntro } from './AdminLoginIntro'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminLoginIntro,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AdminLoginIntro>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
