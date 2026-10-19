import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { StuckDrawTask } from './StuckDrawTask'

import type { Meta, StoryObj } from '@storybook/react-vite'

const NOW = Date.parse('2026-10-08T10:00:00Z')
const DRAW = {
  drawId: 'draw-1',
  title: '매직 키보드 블랙 에디션',
  opensAt: '2026-10-07T00:00:00Z',
  // 마감 2시간 뒤 — 멈춤 기준(1시간)을 넘었다.
  closesAt: '2026-10-08T08:00:00Z',
}

const progress = (settledAt: string | null) => ({
  paidEntries: 3950,
  authorizingEntries: 0,
  awaitingEntries: 120,
  winners: 0,
  drawRequestedAt: null,
  settledAt,
})

// Storybook엔 MSW가 없어 진행 조회를 캐시로 채운다.
const withProgress =
  (settledAt: string | null) => (Story: () => React.ReactNode) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(
      ['admin', 'draws', 'progress', DRAW.drawId],
      progress(settledAt),
    )
    return (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    )
  }

const meta = {
  component: StuckDrawTask,
  tags: ['ai-generated'],
  args: { draw: DRAW, now: NOW },
} satisfies Meta<typeof StuckDrawTask>

export default meta
type Story = StoryObj<typeof meta>

/** 마감 1시간이 지나도 결과가 없으면 카드를 그린다 */
export const Stuck: Story = {
  decorators: [withProgress(null)],
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/추첨 결과가 나오지 않은 회차/)).toBeVisible()
    await expect(canvas.getByRole('link', { name: '회차 확인' })).toBeVisible()
  },
}

/** 결과가 반영됐으면 아무것도 그리지 않는다 */
export const Settled: Story = {
  decorators: [withProgress('2026-10-08T08:01:00Z')],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('article')).toBeNull()
  },
}
