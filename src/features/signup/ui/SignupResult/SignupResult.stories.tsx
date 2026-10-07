import { fn } from 'storybook/test'

import { SignupBackground } from '../SignupBackground'

import { SignupResult } from './SignupResult'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: SignupResult,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SignupResult>

export default meta
type Story = StoryObj<typeof meta>

const frame =
  (scene: 'welcome' | 'failed') => (Story: () => React.ReactNode) => (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '60px 24px' }}>
      <SignupBackground scene={scene} />
      <Story />
    </div>
  )

export const Success: Story = {
  args: { status: 'success', name: '김노바' },
  decorators: [frame('welcome')],
}

export const Fail: Story = {
  args: { status: 'fail', onRetry: fn() },
  decorators: [frame('failed')],
}
