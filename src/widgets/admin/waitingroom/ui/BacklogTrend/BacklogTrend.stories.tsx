import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { BacklogTrend } from './BacklogTrend'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: BacklogTrend,
  tags: ['ai-generated'],
  args: { prefix: '외부 등록 대기' },
} satisfies Meta<typeof BacklogTrend>

export default meta
type Story = StoryObj<typeof meta>

/** 집계를 아직 못 받았으면 숫자 대신 대시 — 0건으로 읽히지 않게 */
export const NoData: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('—')).toBeVisible()
  },
}
