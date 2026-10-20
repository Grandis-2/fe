import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { DrawSummaryCard } from './DrawSummaryCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const NOW = Date.parse('2026-10-08T05:00:00Z')
const HOUR = 60 * 60 * 1000

const draw = (
  drawId: string,
  title: string,
  phase: 'OPEN' | 'CLOSED',
  closesAt: number,
) => ({
  drawId,
  title,
  gift: {
    productId: 'g',
    variantId: 'v',
    productTitle: title,
    optionTitle: '기본',
    imageUrl: null,
  },
  entryFee: 100,
  winnerCount: 100,
  opensAt: new Date(closesAt - 72 * HOUR).toISOString(),
  closesAt: new Date(closesAt).toISOString(),
  phase,
  createdAt: new Date(closesAt - 96 * HOUR).toISOString(),
})

const draws = [
  draw('d-fold', '갤럭시 Z 폴드8', 'OPEN', NOW + 20 * HOUR),
  // 마감 2시간 뒤인데 결과(당첨)가 없다 — 멈춤
  draw('d-keyboard', '매직 키보드', 'CLOSED', NOW - 2 * HOUR),
]

const progress = (paid: number, awaiting: number, winners = 0) => ({
  paidEntries: paid,
  authorizingEntries: 0,
  awaitingEntries: awaiting,
  winners,
})

// Storybook엔 MSW가 없어 조회가 실패한다 — 캐시를 미리 채워 값이 있는 화면을 본다.
const withProgress = (Story: () => React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(
    ['admin', 'draws', 'progress', 'd-fold'],
    progress(3950, 1970),
  )
  queryClient.setQueryData(
    ['admin', 'draws', 'progress', 'd-keyboard'],
    progress(3950, 0),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}

const meta = {
  component: DrawSummaryCard,
  tags: ['ai-generated'],
  decorators: [withProgress],
  args: {
    draws,
    isPending: false,
    now: NOW,
    stuckLookbackMs: 24 * HOUR,
  },
} satisfies Meta<typeof DrawSummaryCard>

export default meta
type Story = StoryObj<typeof meta>

/** 응모 중인 회차는 결제 전환을, 마감 뒤 결과가 없는 회차는 멈춤을 보인다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/진행 1회차/)).toBeVisible()
    await expect(
      canvas.getByRole('img', { name: '결제 완료 66.7%' }),
    ).toBeVisible()
    await expect(canvas.getByText('추첨 멈춤')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { draws: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('응모 중인 회차가 없어요.')).toBeVisible()
  },
}

/** 못 받았으면 '없음'이 아니라 실패라고 말한다 */
export const Failed: Story = {
  args: { draws: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('회차를 불러오지 못했어요.')).toBeVisible()
  },
}
