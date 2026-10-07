import { Logo } from './Logo'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Logo,
  tags: ['ai-generated'],
  // 크기는 부모에게서 물려받는다.
  decorators: [
    (Story) => (
      <div style={{ fontSize: '40px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Admin: Story = {
  args: { suffix: ' ADMIN' },
}
