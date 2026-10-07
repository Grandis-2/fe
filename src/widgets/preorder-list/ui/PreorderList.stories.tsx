import type { PreorderCardData } from '@entities/preorder'
import { color, spacing } from '@shared/config/theme'

import { PreorderList } from './PreorderList'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 상태는 오늘 날짜로 정해지므로 날짜도 오늘 기준으로 만든다.
const fromToday = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const item = (
  id: string,
  title: string,
  [open, close]: [number, number],
): PreorderCardData => ({
  id,
  imageSrc: '/images/banner1.png',
  title,
  benefit: '사전예약 혜택 문구',
  opensAt: fromToday(open),
  closesAt: fromToday(close),
})

const meta = {
  component: PreorderList,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  args: {
    preorders: [
      item('1', '아이폰 18 Pro · Pro Max', [-9, 5]),
      item('2', '갤럭시 Z 폴드8', [-6, 7]),
      item('3', '갤럭시 워치', [-4, 10]),
      item('4', '아이폰 Duo', [15, 28]),
      item('5', '에어팟 프로 3', [-34, -21]),
    ],
  },
  decorators: [
    (Story) => (
      <div
        style={{ background: color.backgroundDark.base, padding: spacing[40] }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PreorderList>

export default meta
type Story = StoryObj<typeof meta>

export const Live: Story = {}

export const Soon: Story = {
  parameters: { initialEntries: ['/preorder?status=soon'] },
}

export const Empty: Story = { args: { preorders: [] } }
