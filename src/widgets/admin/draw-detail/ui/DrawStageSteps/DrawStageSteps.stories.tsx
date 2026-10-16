import { expect } from 'storybook/test'

import { DrawStageSteps } from './DrawStageSteps'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: DrawStageSteps,
  tags: ['ai-generated'],
  args: { stage: 'OPEN' },
} satisfies Meta<typeof DrawStageSteps>

export default meta
type Story = StoryObj<typeof meta>

/** 응모 중 — 첫 단계가 지금 단계다 */
export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('응모 중')).toHaveAttribute(
      'aria-current',
      'step',
    )
  },
}

/** 결제 확인 중인 응모가 남아 추첨을 기다린다 */
export const WaitingPayment: Story = {
  args: { stage: 'WAITING_PAYMENT' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('결제 확인 대기')).toHaveAttribute(
      'aria-current',
      'step',
    )
  },
}

/** 결과까지 반영되면 모든 단계가 끝난 것으로 그린다 */
export const Settled: Story = {
  args: { stage: 'SETTLED' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/당첨 주문이 생겼고/)).toBeVisible()
  },
}

/** 마감 뒤 1시간이 넘도록 결과가 없으면 추첨 단계에 경고로 멈춘다 */
export const Stuck: Story = {
  args: { stage: 'STUCK' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('결과 지연')).toHaveAttribute(
      'aria-current',
      'step',
    )
    await expect(canvas.getByText(/개발팀에 알려 주세요/)).toBeVisible()
  },
}

/** 시작 전엔 지금 단계가 없다 */
export const Scheduled: Story = {
  args: { stage: 'SCHEDULED' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-current]')).toBeNull()
  },
}
