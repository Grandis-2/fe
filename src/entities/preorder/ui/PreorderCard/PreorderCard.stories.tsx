import { PreorderCard } from './PreorderCard'

import type { PreorderCardData } from './PreorderCard'
import type { Meta, StoryObj } from '@storybook/react-vite'

// 상태는 오늘 날짜로 정해지므로, 스토리 날짜도 오늘 기준으로 만든다.
const fromToday = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const base: PreorderCardData = {
  id: '1',
  imageSrc: '/images/banner1.png',
  title: '아이폰 18 Pro · Pro Max',
  benefit: '사전예약 시 맥세이프 케이스 증정',
  opensAt: fromToday(-9),
  closesAt: fromToday(5),
}

const meta = {
  component: PreorderCard,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <div style={{ width: 380, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PreorderCard>

export default meta
type Story = StoryObj<typeof meta>

export const Live: Story = { args: { data: base } }

export const Soon: Story = {
  args: {
    data: {
      ...base,
      title: '아이폰 Duo',
      benefit: '알림 신청자 대상 쿠폰 지급',
      opensAt: fromToday(15),
      closesAt: fromToday(28),
    },
  },
}

export const Done: Story = {
  args: {
    data: {
      ...base,
      title: '에어팟 프로 3',
      benefit: '각인 서비스 무료',
      opensAt: fromToday(-34),
      closesAt: fromToday(-21),
    },
  },
}
