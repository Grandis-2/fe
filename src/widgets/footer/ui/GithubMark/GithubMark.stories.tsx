import { GithubMark } from './GithubMark'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: GithubMark,
  tags: ['ai-generated'],
} satisfies Meta<typeof GithubMark>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { size: 26 } }
