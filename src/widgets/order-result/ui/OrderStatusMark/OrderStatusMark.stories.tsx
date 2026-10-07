import { OrderStatusMark } from './OrderStatusMark'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OrderStatusMark,
  tags: ['ai-generated'],
} satisfies Meta<typeof OrderStatusMark>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = { args: { tone: 'success' } }
export const Pending: Story = { args: { tone: 'pending' } }
export const Failure: Story = { args: { tone: 'failure' } }
