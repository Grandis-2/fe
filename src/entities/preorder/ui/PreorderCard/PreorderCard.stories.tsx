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
  opensAt: fromToday(0),
  openTime: '09:00',
  closesAt: fromToday(0),
  closeTime: '23:59',
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
      closesAt: fromToday(15),
    },
  },
}

export const Done: Story = {
  args: {
    data: {
      ...base,
      title: '에어팟 프로 3',
      benefit: '각인 서비스 무료',
      opensAt: fromToday(-21),
      closesAt: fromToday(-21),
    },
  },
}

// 제목이 길어도 자르지 않는다 — 회차는 이름 끝으로 갈린다.
export const LongTitle: Story = {
  args: {
    data: {
      ...base,
      title: '[부하 시험] 무선 이어폰 LT 1020-0531 (진입) · 1020-0501 (준비)',
    },
  },
}
