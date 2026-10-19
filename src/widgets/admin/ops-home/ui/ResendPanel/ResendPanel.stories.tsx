import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, fn, within } from 'storybook/test'

import { sentRunStore } from '../../model/sentRun'

import { ResendPanel } from './ResendPanel'

import type { Meta, StoryObj } from '@storybook/react-vite'

const IPHONE = 'p-iphone'
const NOW = Date.now()

// Storybook엔 MSW가 없어 조회가 실패한다 — 원인 묶음 캐시를 미리 채운다.
const withCauses =
  (groups: { errorCode: string; count: number }[]) =>
  (Story: () => React.ReactNode) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(
      ['admin', 'reservations', 'sync-job-errors', 'dead-letter'],
      groups,
    )
    return (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    )
  }

const causes = [
  { errorCode: 'TIMEOUT', count: 40 },
  { errorCode: 'MOCK_REJECTED', count: 6 },
  { errorCode: 'HTTP_503', count: 820 },
]

const meta = {
  component: ResendPanel,
  tags: ['ai-generated'],
  args: {
    id: 'ops-resend',
    selected: null,
    failuresByScope: { all: 866, [IPHONE]: 856 },
    onSelectAll: fn(),
    now: NOW,
  },
  decorators: [withCauses(causes)],
} satisfies Meta<typeof ResendPanel>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 전체 — 맨 위 한 줄이 지금 상태를 말하고, 원인을 고르고 보낸다. 일시 장애만 기본으로
 * 골라지고 거절은 빠져 있다(그 줄에 이유와 한 건씩 보기)
 */
export const All: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByText(/866건이 다시 보내기를 기다려요/),
    ).toBeVisible()

    const [first] = canvas.getAllByRole('checkbox')
    await expect(first.closest('label')).toHaveTextContent(
      '외부 예약 시스템 일시 중단',
    )
    await expect(
      canvas.getByRole('checkbox', { name: /접수를 거절/ }),
    ).not.toBeChecked()
    await expect(canvas.getByText(/보내도 같은 결과예요/)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '860건 다시 보내기' }),
    ).toBeEnabled()

    await userEvent.click(
      canvas.getByRole('checkbox', { name: /응답하지 않음/ }),
    )
    await expect(canvas.getByText('보낼 실패 820건')).toBeVisible()
    await expect(canvas.getByText(/약 41초에 나눠 보내요/)).toBeVisible()
  },
}

/**
 * 사전예약을 고르면 상태는 그 사전예약 기준이다. 사전예약별 보내기는 서버가 상품 조건을
 * 받기 전까지 막혀 있고, 전체로 돌아가 보낼 수 있다
 */
export const ProductSelected: Story = {
  args: { selected: IPHONE, scopeName: '아이폰 18 Pro' },
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByText(/^아이폰 18 Pro — 856건이 다시 보내기를 기다려요/),
    ).toBeVisible()
    await expect(
      canvas.getByText(/모든 사전예약을 합친 값이에요/),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '아이폰 18 Pro 다시 보내기' }),
    ).toBeDisabled()
    await expect(canvas.getByText('아이폰 18 Pro 실패 856건')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '전체에서 보내기' }),
    )
    await expect(args.onSelectAll).toHaveBeenCalled()
  },
}

/** 다시 보낼 실패가 없으면 상태 한 줄이 그렇다고 말하고 보내기를 막는다 */
export const NothingToSend: Story = {
  args: { failuresByScope: { all: 0 } },
  decorators: [withCauses([])],
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('다시 보낼 외부 등록 실패가 없어요.'),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '0건 다시 보내기' }),
    ).toBeDisabled()
  },
}

/**
 * 보낸 뒤 — 보낸 기록에 처리 상태와 결과(같은 원인의 남은 실패)를, 맨 위 한 줄에 보낼 때와
 * 지금을 보인다. 예상 시간이 지난 기록을 넣어 끝난 상태를 본다(Storybook엔 API가 없어 못 보낸다).
 */
export const AfterSend: Story = {
  args: { failuresByScope: { all: 12 } },
  decorators: [
    withCauses([
      { errorCode: 'HTTP_503', count: 12 },
      { errorCode: 'TIMEOUT', count: 0 },
    ]),
    (Story) => {
      sentRunStore.add({
        at: NOW - 120_000,
        targetCount: 860,
        skippedCount: 0,
        estimatedSeconds: 43,
        capped: false,
        failuresAtSend: { all: 860 },
        byErrorCode: { HTTP_503: 820, TIMEOUT: 40 },
      })
      return <Story />
    },
  ],
  play: async ({ canvas }) => {
    const [row] = within(
      canvas.getByRole('list', { name: '보낸 기록' }),
    ).getAllByRole('listitem')
    await expect(row).toHaveTextContent('860건 다시 보냄')
    await expect(row).toHaveTextContent('처리 끝 · 같은 원인 실패 지금 12건')
    await expect(
      canvas.getByText(/실패가 860 → 12건으로 줄었어요/),
    ).toBeVisible()
  },
}
