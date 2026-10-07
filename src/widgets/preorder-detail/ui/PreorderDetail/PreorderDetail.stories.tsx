import { MOCK_PREORDERS } from '@entities/preorder'
import type { Preorder } from '@entities/preorder'
import { color, spacing } from '@shared/config/theme'

import { PreorderDetail } from './PreorderDetail'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 상태는 오늘 날짜로 정해지므로 날짜를 오늘 기준으로 다시 잡는다.
const fromToday = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const withDates = ([open, close, payment, release]: [
  number,
  number,
  number,
  number,
]): Preorder => ({
  ...MOCK_PREORDERS[0],
  opensAt: fromToday(open),
  closesAt: fromToday(close),
  paymentEndsAt: fromToday(payment),
  releaseAt: fromToday(release),
})

const meta = {
  component: PreorderDetail,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div
        style={{ background: color.backgroundDark.base, padding: spacing[40] }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PreorderDetail>

export default meta
type Story = StoryObj<typeof meta>

export const Live: Story = { args: { preorder: withDates([-9, 5, 9, 12]) } }

export const Soon: Story = { args: { preorder: withDates([15, 28, 32, 35]) } }

export const Done: Story = {
  args: { preorder: withDates([-34, -21, -18, -16]) },
}
