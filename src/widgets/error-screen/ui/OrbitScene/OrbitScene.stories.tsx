import { OrbitScene } from './OrbitScene'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OrbitScene,
  parameters: { dark: true, layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrbitScene>

export default meta
type Story = StoryObj<typeof meta>

/** 404 배경 — 행성이 궤도를 돌고 OBJ 404가 궤도 밖으로 떠난다 */
export const Default: Story = {}
