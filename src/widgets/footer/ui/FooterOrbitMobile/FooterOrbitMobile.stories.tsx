import { fn } from 'storybook/test'

import { color } from '@shared/config/theme'

import { FooterOrbitMobile } from './FooterOrbitMobile'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FooterOrbitMobile,
  tags: ['ai-generated'],
  args: { activeId: 'be0', onToggle: fn() },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div style={{ padding: 16, background: color.backgroundDark.base }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FooterOrbitMobile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
