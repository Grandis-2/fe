import { expect } from 'storybook/test'

import { QueueCard } from './QueueCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const START = new Date('2026-10-20T05:22:00Z').getTime()
const times = Array.from({ length: 11 }, (_, i) => START + i * 60_000)

const meta = {
  component: QueueCard,
  tags: ['ai-generated'],
  args: {
    waiting: 1240,
    perMinute: 120,
    braking: false,
    history: {
      times,
      values: [200, 220, 300, 380, 500, 600, 700, 820, 920, 1100, 1240],
    },
    flow: { backlog: 0, payable: 12480, reserved: 3210 },
  },
} satisfies Meta<typeof QueueCard>

export default meta
type Story = StoryObj<typeof meta>

/** 줄이 늘어나는 중 — 경고 판정과 대기열 입장 속도 조절 버튼 */
export const Rising: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('분당 +120명 늘어나는 중')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: '입장 속도 조절' }),
    ).toHaveAttribute('href', '/admin/waitingroom')
    await expect(
      canvas.getByRole('list', { name: '예약 흐름' }),
    ).toHaveTextContent('대기열1,240명')
  },
}

/** 줄어드는 중 — 비기까지 남은 시간, 버튼 없음 */
export const Falling: Story = {
  args: {
    waiting: 640,
    perMinute: -80,
    history: {
      times,
      values: [1280, 1300, 1220, 1120, 1020, 940, 860, 800, 740, 690, 640],
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('분당 −80명 · 약 8분 뒤 비어요'),
    ).toBeVisible()
    await expect(canvas.queryByRole('link')).toBeNull()
  },
}

/** 유지 — 들어오는 만큼 입장 중. 줄은 남아 있지만 늘지도 줄지도 않는다 */
export const Steady: Story = {
  args: {
    waiting: 320,
    perMinute: 0.4,
    history: {
      times,
      values: [310, 330, 315, 325, 318, 322, 316, 324, 319, 321, 320],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('들어오는 만큼 입장 중')).toBeVisible()
    await expect(canvas.queryByRole('link')).toBeNull()
  },
}

/** 대기 없음 — 오는 대로 바로 입장한다 */
export const Empty: Story = {
  args: {
    waiting: 0,
    perMinute: 0,
    history: {
      times,
      values: [40, 30, 20, 10, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('대기 없음')).toBeVisible()
  },
}

/** 서버가 부하로 입장을 줄이는 중이면 한 줄 더 */
export const Braking: Story = {
  args: { braking: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('서버 부하로 입장을 줄이는 중이에요'),
    ).toBeVisible()
  },
}

/** 화면을 막 열어 표본이 없으면 추세를 재는 중, 그래프 자리는 skeleton */
export const Measuring: Story = {
  args: {
    waiting: 120,
    perMinute: null,
    history: { times: [START], values: [120] },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('추세를 재는 중')).toBeVisible()
  },
}
