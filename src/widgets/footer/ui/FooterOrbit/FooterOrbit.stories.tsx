import { fn } from 'storybook/test'

import { color } from '@shared/config/theme'

import { FooterOrbit } from './FooterOrbit'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FooterOrbit,
  tags: ['ai-generated'],
  args: { activeId: 'be0', onHover: fn(), onToggle: fn() },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: color.backgroundDark.base }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FooterOrbit>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
