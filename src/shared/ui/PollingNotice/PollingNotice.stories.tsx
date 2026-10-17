import { PollingNotice } from './PollingNotice'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PollingNotice,
} satisfies Meta<typeof PollingNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Retrying: Story = {
  args: { query: { fetchStatus: 'fetching', failureCount: 2 } },
}

export const Offline: Story = {
  args: { query: { fetchStatus: 'paused', failureCount: 0 } },
}
