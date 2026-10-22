import { expect } from 'storybook/test'

import { ShipmentBatchProgress } from './ShipmentBatchProgress'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ShipmentBatchProgress,
  tags: ['ai-generated'],
  args: {
    accepting: true,
    issuedCount: 9830,
    batches: [
      {
        batchNumber: 1,
        positionFrom: 1,
        positionTo: 5000,
        estimatedShipStart: '2026-10-28',
        estimatedShipEnd: '2026-10-30',
      },
      {
        batchNumber: 2,
        positionFrom: 5001,
        positionTo: 12000,
        estimatedShipStart: '2026-11-04',
        estimatedShipEnd: '2026-11-06',
      },
      {
        batchNumber: 3,
        positionFrom: 12001,
        positionTo: null,
        estimatedShipStart: '2026-11-11',
        estimatedShipEnd: '2026-11-13',
      },
    ],
  },
} satisfies Meta<typeof ShipmentBatchProgress>

export default meta
type Story = StoryObj<typeof meta>

/** 접수 중 — 발급한 순번을 차수에 나누고, 지금 받는 차수를 표시한다 */
export const Accepting: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('9,830번까지 발급')).toBeVisible()
    await expect(canvas.getByText('4,830개')).toBeVisible()
    await expect(canvas.getByText('다 참')).toBeVisible()
    await expect(canvas.getByText('접수 중')).toBeVisible()
  },
}

/** 발급 수를 못 받았으면 막대 없이 표만 보인다 */
export const WithoutIssuedCount: Story = {
  args: { issuedCount: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/번까지 발급/)).toBeNull()
    await expect(canvas.getAllByText('—')).toHaveLength(3)
  },
}
