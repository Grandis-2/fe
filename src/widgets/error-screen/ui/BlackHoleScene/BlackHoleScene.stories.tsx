import { BlackHoleScene } from './BlackHoleScene'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: BlackHoleScene,
  parameters: { dark: true, layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BlackHoleScene>

export default meta
type Story = StoryObj<typeof meta>

/** 500 배경 — 격자가 우물로 흘러 들고 빨간 신호가 떨어진다 */
export const Default: Story = {}
