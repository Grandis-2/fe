import { SignupBackground } from './SignupBackground'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: SignupBackground,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SignupBackground>

export default meta
type Story = StoryObj<typeof meta>

export const Form: Story = { args: { scene: 'form' } }
export const Welcome: Story = { args: { scene: 'welcome' } }
export const Failed: Story = { args: { scene: 'failed' } }
