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
  winnerCount: number,
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
  winnerCount,
  opensAt: new Date(closesAt - 72 * HOUR).toISOString(),
  closesAt: new Date(closesAt).toISOString(),
  phase,
  createdAt: new Date(closesAt - 96 * HOUR).toISOString(),
})

const draws = [
  draw('d-fold', '갤럭시 Z 폴드8', 'OPEN', NOW + 20 * HOUR, 200),
  draw('d-watch', '갤럭시 워치 클래식', 'CLOSED', NOW - 10 * 60_000, 500),
  draw('d-airpods', '에어팟 프로 3', 'CLOSED', NOW - 3 * HOUR, 300),
  // 마감 2시간 뒤인데 결과가 없다 — 지연
  draw('d-keyboard', '매직 키보드', 'CLOSED', NOW - 2 * HOUR, 1000),
]

const progress = (overrides = {}) => ({
  paidEntries: 3950,
  authorizingEntries: 0,
  awaitingEntries: 1970,
  winners: 0,
  drawRequestedAt: null,
  settledAt: null,
  ...overrides,
})

// Storybook엔 MSW가 없어 조회가 실패한다 — 캐시를 미리 채워 값이 있는 화면을 본다.
const withProgress = (Story: () => React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const seed = (drawId: string, value: ReturnType<typeof progress>) =>
    queryClient.setQueryData(['admin', 'draws', 'progress', drawId], value)
  seed('d-fold', progress())
  seed('d-watch', progress({ authorizingEntries: 14 }))
  seed(
    'd-airpods',
    progress({ winners: 300, settledAt: new Date(NOW - HOUR).toISOString() }),
  )
  seed('d-keyboard', progress())
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ height: 360, display: 'grid' }}>
        <Story />
      </div>
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
    recentMs: 24 * HOUR,
  },
} satisfies Meta<typeof DrawSummaryCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 응모 중(마감 임박 순) 다음에 최근 마감한 회차 — 결제 확인·결과 반영·지연이 단계 막대로
 * 보인다. 카드 높이를 넘는 회차는 목록 안에서 스크롤한다.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: '진행 중인 럭키드로우' }),
    ).toBeVisible()
    await expect(canvas.getByText('14건 확인 중')).toBeInTheDocument()
    await expect(canvas.getByText('당첨 300명')).toBeInTheDocument()
    await expect(canvas.getByText(/^지연 · /)).toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { draws: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('진행 중인 회차가 없어요.')).toBeVisible()
  },
}

/** 못 받았으면 '없음'이 아니라 실패라고 말한다 */
export const Failed: Story = {
  args: { draws: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('회차를 불러오지 못했어요.')).toBeVisible()
  },
}
