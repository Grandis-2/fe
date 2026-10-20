import { useState } from 'react'

import { expect } from 'storybook/test'

import { color } from '@shared/config/theme'

import { OpenAlertToggle } from './OpenAlertToggle'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OpenAlertToggle,
  args: { subscribed: false, name: '아이폰 18 Pro', onToggle: () => {} },
  decorators: [
    (Story) => (
      <div style={{ background: color.backgroundDark.base, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OpenAlertToggle>

export default meta
type Story = StoryObj<typeof meta>

// 누를 때마다 꺼진 종 ↔ 울리는 종으로 바뀐다.
export const Toggle: Story = {
  render: (args) => {
    const [subscribed, setSubscribed] = useState(args.subscribed)
    return (
      <OpenAlertToggle
        {...args}
        subscribed={subscribed}
        onToggle={() => setSubscribed(!subscribed)}
      />
    )
  },
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('button', {
      name: '아이폰 18 Pro 오픈 알림',
    })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  },
}
