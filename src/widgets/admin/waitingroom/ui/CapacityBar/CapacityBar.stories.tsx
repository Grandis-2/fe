import { expect } from 'storybook/test'

import { CapacityBar } from './CapacityBar'

import type { Meta, StoryObj } from '@storybook/react-vite'

const capacity = {
  recommendedMax: 150,
  dangerLine: 400,
  appliedCredit: 120,
  readyTasks: 3,
  warmingTasks: 0,
  brakeFactor: 1,
  relayBadRatio: 0.02,
  scalingPending: false,
}

const meta = {
  component: CapacityBar,
  tags: ['ai-generated'],
  args: { capacity, setting: 120, draft: 250, applied: 120 },
} satisfies Meta<typeof CapacityBar>

export default meta
type Story = StoryObj<typeof meta>

/** 권장·위험선과 설정·바꿀 값이 함께 찍힌다. 실제 적용이 설정과 같으면 따로 찍지 않는다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', {
        name: '권장 150, 위험 400, 설정 120, 바꿀 값 250',
      }),
    ).toBeVisible()
    await expect(canvas.getByText('최근 접수 실패·지연 2%')).toBeVisible()
  },
}

/** 서버가 늘어나는 중 — 설정보다 적게 들어가면 실제 적용을 따로 찍는다 */
export const ScalingPending: Story = {
  args: {
    capacity: { ...capacity, warmingTasks: 2, scalingPending: true },
    setting: 250,
    draft: null,
    applied: 150,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('적용 150')).toBeVisible()
    await expect(canvas.getByText(/늘어나는 중 2대/)).toBeVisible()
  },
}
