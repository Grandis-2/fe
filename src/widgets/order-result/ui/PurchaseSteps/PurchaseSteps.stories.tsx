import { expect } from 'storybook/test'

import { PurchaseSteps } from './PurchaseSteps'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: PurchaseSteps,
  tags: ['ai-generated'],
} satisfies Meta<typeof PurchaseSteps>

export default meta
type Story = StoryObj<typeof meta>

// 외부 등록을 기다리는 중 — 구매 확정은 아직 차례가 아니다.
export const Processing: Story = {
  args: { reservation: { displayStatus: 'PROCESSING' } },
  play: async ({ canvas }) => {
    const current = canvas.getByRole('listitem', { current: 'step' })
    await expect(current).toHaveTextContent('예약 처리')
  },
}

export const Payable: Story = {
  args: { reservation: { displayStatus: 'PAYABLE' } },
  play: async ({ canvas }) => {
    const current = canvas.getByRole('listitem', { current: 'step' })
    await expect(current).toHaveTextContent('구매 확정')
  },
}

export const Canceled: Story = {
  args: { reservation: { displayStatus: 'CANCELED' } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('list')).toBeNull()
  },
}
