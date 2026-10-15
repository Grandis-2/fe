import { color } from '@shared/config/theme'

import { TEAM } from '../../model/team'

import { MemberDetail } from './MemberDetail'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MemberDetail,
  tags: ['ai-generated'],
  args: { member: TEAM[0], visible: true },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: color.backgroundDark.base }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MemberDetail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Hidden: Story = { args: { visible: false } }
