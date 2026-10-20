import { expect } from 'storybook/test'

import { DrawProgressSteps } from './DrawProgressSteps'

import type { Meta, StoryObj } from '@storybook/react-vite'

const NOW = Date.parse('2026-10-08T05:00:00Z')
const HOUR = 60 * 60 * 1000
const iso = (offset: number) => new Date(NOW + offset).toISOString()

const progress = (overrides = {}) => ({
  paidEntries: 3950,
  authorizingEntries: 0,
  awaitingEntries: 1970,
  winners: 0,
  drawRequestedAt: null,
  settledAt: null,
  ...overrides,
})

const meta = {
  component: DrawProgressSteps,
  tags: ['ai-generated'],
  args: {
    draw: { opensAt: iso(-72 * HOUR), closesAt: iso(20 * HOUR) },
    progress: progress(),
    now: NOW,
  },
} satisfies Meta<typeof DrawProgressSteps>

export default meta
type Story = StoryObj<typeof meta>

/** 응모 중 — 첫 칸이 지금 단계, 마감까지 남은 시간 */
export const Open: Story = {
  play: async ({ canvas }) => {
    const current = canvas
      .getAllByRole('listitem')
      .find((item) => item.getAttribute('aria-current') === 'step')
    await expect(current).toHaveTextContent('응모 중20시간 0분 남음')
  },
}

/** 마감했는데 결제 확인 중인 응모가 남아 추첨을 못 한다 */
export const WaitingPayment: Story = {
  args: {
    draw: { opensAt: iso(-72 * HOUR), closesAt: iso(-10 * 60_000) },
    progress: progress({ authorizingEntries: 14 }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('14건 확인 중')).toBeVisible()
  },
}

export const Settled: Story = {
  args: {
    draw: { opensAt: iso(-72 * HOUR), closesAt: iso(-2 * HOUR) },
    progress: progress({ winners: 300, settledAt: iso(-HOUR) }),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('당첨 300명')).toBeVisible()
  },
}

/** 마감 뒤 1시간이 넘도록 결과가 없다 — 추첨 칸을 경고로 */
export const Stuck: Story = {
  args: {
    draw: { opensAt: iso(-72 * HOUR), closesAt: iso(-(HOUR + 12 * 60_000)) },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('지연 · 1시간 12분째')).toBeVisible()
  },
}
