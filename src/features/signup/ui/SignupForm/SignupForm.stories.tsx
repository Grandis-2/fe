import { fn } from 'storybook/test'

import { SignupBackground } from '../SignupBackground'

import { SignupForm } from './SignupForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: SignupForm,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  args: { onComplete: fn(), onFail: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '60px 24px' }}>
        <SignupBackground scene="form" />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignupForm>

export default meta
type Story = StoryObj<typeof meta>

// Storybook엔 API가 없어 다 채워 제출하면 onFail이 불린다 — 빈 칸으로 제출하면 칸별 오류를 볼 수 있다.
export const Default: Story = {}
