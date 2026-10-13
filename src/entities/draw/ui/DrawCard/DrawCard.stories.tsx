import { DrawCard } from './DrawCard'

import type { DrawCardData } from './DrawCard'
import type { Meta, StoryObj } from '@storybook/react-vite'

// 단계는 지금 시각으로 정해지므로, 스토리 시각도 지금 기준으로 만든다.
const fromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

const base: DrawCardData = {
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
  opensAt: fromNow(-2),
  closesAt: fromNow(3),
}

const meta = {
  component: DrawCard,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <div style={{ width: 280, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DrawCard>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = { args: { data: base } }

export const ClosingToday: Story = {
  args: { data: { ...base, closesAt: fromNow(0.2) } },
}

export const Scheduled: Story = {
  args: { data: { ...base, opensAt: fromNow(8), closesAt: fromNow(12) } },
}

export const Closed: Story = {
  args: { data: { ...base, opensAt: fromNow(-12), closesAt: fromNow(-9) } },
}
