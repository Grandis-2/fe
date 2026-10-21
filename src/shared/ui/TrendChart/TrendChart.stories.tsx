import { expect } from 'storybook/test'

import { TrendChart } from './TrendChart'

import type { Meta, StoryObj } from '@storybook/react-vite'

const START = new Date('2026-10-20T05:22:00Z').getTime()
const times = Array.from({ length: 11 }, (_, i) => START + i * 60_000)

const meta = {
  component: TrendChart,
  tags: ['ai-generated'],
  args: {
    times,
    values: [200, 220, 300, 380, 500, 600, 700, 820, 920, 1100, 1240],
    unit: '건',
    label: '외부 등록 대기',
    tone: 'warning',
  },
} satisfies Meta<typeof TrendChart>

export default meta
type Story = StoryObj<typeof meta>

/** 늘어나는 중 — 주황 선, 지금 값은 끝점 */
export const Rising: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: /지금 1,240건/ }),
    ).toBeVisible()
    await expect(canvas.getByText('지금')).toBeVisible()
  },
}

/** 줄어드는 중 — 남색 선 */
export const Falling: Story = {
  args: {
    tone: 'primary',
    values: [1280, 1300, 1220, 1120, 1020, 940, 860, 800, 740, 690, 640],
  },
}

/** 표본이 하나뿐이면 같은 높이의 회색 막대로 자리를 잡는다 */
export const NotEnough: Story = {
  args: { times: [START], values: [10] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('figure')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  },
}
