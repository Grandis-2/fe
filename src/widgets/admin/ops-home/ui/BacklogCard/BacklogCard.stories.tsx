import { expect } from 'storybook/test'

import { BacklogCard } from './BacklogCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const START = new Date('2026-10-20T05:22:00Z').getTime()
const times = Array.from({ length: 11 }, (_, i) => START + i * 60_000)

const meta = {
  component: BacklogCard,
  tags: ['ai-generated'],
  args: {
    backlog: 1240,
    perMinute: 120,
    braking: false,
    history: {
      times,
      values: [200, 220, 300, 380, 500, 600, 700, 820, 920, 1100, 1240],
    },
    flow: { waiting: 18240, payable: 12480, reserved: 3210 },
  },
} satisfies Meta<typeof BacklogCard>

export default meta
type Story = StoryObj<typeof meta>

/** 밀리는 중 — 경고 판정과 대기열 입장 속도 조절 버튼 */
export const Rising: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('분당 +120건 늘어나는 중')).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: '입장 속도 조절' }),
    ).toHaveAttribute('href', '/admin/waitingroom')
    await expect(
      canvas.getByRole('list', { name: '예약 흐름' }),
    ).toHaveTextContent('대기열18,240명')
  },
}

/** 풀리는 중 — 해소까지 남은 시간, 버튼 없음 */
export const Falling: Story = {
  args: {
    backlog: 640,
    perMinute: -80,
    history: {
      times,
      values: [1280, 1300, 1220, 1120, 1020, 940, 860, 800, 740, 690, 640],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('분당 −80건 · 약 8분 뒤 해소')).toBeVisible()
    await expect(canvas.queryByRole('link')).toBeNull()
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
    backlog: 120,
    perMinute: null,
    history: { times: [START], values: [120] },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('추세를 재는 중')).toBeVisible()
  },
}
