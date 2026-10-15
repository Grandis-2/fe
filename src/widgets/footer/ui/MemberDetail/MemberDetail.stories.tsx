import { TEAM } from '../../model/team'

import { MemberDetail } from './MemberDetail'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: MemberDetail,
  tags: ['ai-generated'],
  args: { member: TEAM[0], visible: true },
  parameters: { dark: true },
} satisfies Meta<typeof MemberDetail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Hidden: Story = { args: { visible: false } }
