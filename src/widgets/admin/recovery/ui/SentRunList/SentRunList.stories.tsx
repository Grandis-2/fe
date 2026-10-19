import { expect } from 'storybook/test'

import { SentRunList } from './SentRunList'

import type { Meta, StoryObj } from '@storybook/react-vite'

const NOW = Date.parse('2026-10-08T05:21:00Z')

const run = (agoSeconds: number, estimatedSeconds: number) => ({
  at: NOW - agoSeconds * 1000,
  targetCount: 860,
  skippedCount: 0,
  estimatedSeconds,
  capped: false,
  failuresAtSend: { all: 860 },
  byErrorCode: { HTTP_503: 820, TIMEOUT: 40 },
})

const meta = {
  component: SentRunList,
  tags: ['ai-generated'],
  args: {
    now: NOW,
    runs: [run(13, 43), run(500, 6)],
    failuresByCode: { HTTP_503: 400, TIMEOUT: 20 },
  },
} satisfies Meta<typeof SentRunList>

export default meta
type Story = StoryObj<typeof meta>

/** 최근 것이 처리 중이면 남은 시간을, 앞 기록은 처리 끝만 보인다 */
export const Pending: Story = {
  play: async ({ canvas }) => {
    const [latest, older] = canvas.getAllByRole('listitem')
    await expect(latest).toHaveTextContent('860건 다시 보냄')
    await expect(latest).toHaveTextContent('외부 예약 시스템 일시 중단 820')
    await expect(latest).toHaveTextContent('처리 중 · 약 30초 남음')
    await expect(older).toHaveTextContent('처리 끝')
    await expect(older).not.toHaveTextContent('같은 원인 실패')
  },
}

/** 끝나면 그 원인의 남은 실패 수로 결과를 보인다 */
export const Left: Story = {
  args: { runs: [run(120, 43)] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('listitem')).toHaveTextContent(
      '처리 끝 · 같은 원인 실패 지금 420건',
    )
  },
}

/** 남은 실패가 없으면 끝 */
export const Success: Story = {
  args: { runs: [run(120, 43)], failuresByCode: {} },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('listitem')).toHaveTextContent(
      '처리 끝 · 같은 원인 실패 지금 0건',
    )
  },
}
