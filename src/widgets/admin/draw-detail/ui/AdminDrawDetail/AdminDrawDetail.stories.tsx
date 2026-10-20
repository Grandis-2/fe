import { expect } from 'storybook/test'

import { AdminDrawDetail } from './AdminDrawDetail'

import type { Meta, StoryObj } from '@storybook/react-vite'

const DAY = 24 * 60 * 60 * 1000
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString()

// 목업 저장소의 첫 회차(응모 중) — 진행은 MSW가 회차 id로 흉내 낸다.
const draw = {
  drawId: '60000001-0000-4000-8000-000000000000',
  title: '아이폰 18 Pro Max 1TB 한정판',
  gift: {
    productId: '20000001-0000-4000-8000-000000000000',
    variantId: '30000001-0000-4000-8000-000000000000',
    productTitle: '아이폰 18 Pro Max 1TB 한정판',
    optionTitle: '코스믹 오렌지',
    imageUrl: '/images/banner1.png',
  },
  entryFee: 100,
  winnerCount: 300,
  opensAt: iso(-2 * DAY),
  closesAt: iso(3 * DAY),
  phase: 'OPEN' as const,
  createdAt: iso(-5 * DAY),
}

const meta = {
  component: AdminDrawDetail,
  tags: ['ai-generated'],
  args: { draw, fetchedAt: Date.now() },
} satisfies Meta<typeof AdminDrawDetail>

export default meta
type Story = StoryObj<typeof meta>

/** 응모 중 — 진행 카드와 회차 정보가 나오고 자동 갱신한다 */
export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      draw.title,
    )
    await expect(canvas.getByText('결제 완료(추첨 대상)')).toBeVisible()
    await expect(canvas.getByText(/10초마다 자동 갱신/)).toBeVisible()
  },
}

/** 마감 뒤 1시간이 넘도록 결과가 없으면 개발팀에 알릴 id 복사를 띄운다 */
export const Stuck: Story = {
  args: {
    // 목업에 없는 회차라 진행 조회가 실패한다 — 진행을 모르는 채 시각으로만 나눈다.
    draw: {
      ...draw,
      drawId: '6fffffff-0000-4000-8000-000000000000',
      opensAt: iso(-3 * DAY),
      closesAt: iso(-2 * DAY),
      phase: 'CLOSED' as const,
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('button', { name: '회차 id 복사' }),
    ).toBeVisible()
  },
}
