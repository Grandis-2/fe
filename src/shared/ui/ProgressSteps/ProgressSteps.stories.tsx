import { expect } from 'storybook/test'

import { ProgressSteps } from './ProgressSteps'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ProgressSteps,
  tags: ['ai-generated'],
  args: {
    steps: [
      {
        key: 'received',
        label: '접수',
        detail: '2026.10.21 14:30:12',
        tone: 'done',
      },
      {
        key: 'register',
        label: '외부 등록 · 실패',
        detail: '시도 5회 · 재처리 필요',
        tone: 'stuck',
      },
      {
        key: 'payment',
        label: '결제',
        detail: '등록 뒤 24시간 안',
        tone: 'todo',
      },
      { key: 'reserved', label: '예약 확정', detail: '—', tone: 'todo' },
    ],
  },
} satisfies Meta<typeof ProgressSteps>

export default meta
type Story = StoryObj<typeof meta>

/** 외부 등록에서 막힘 — 색과 함께 상태를 읽어 준다 */
export const Stuck: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/외부 등록 · 실패/)).toBeVisible()
    await expect(
      canvas.getByText('(막힘)', { exact: false }),
    ).toBeInTheDocument()
  },
}

/** 결제 기한 임박 */
export const PaymentSoon: Story = {
  args: {
    steps: [
      {
        key: 'received',
        label: '접수',
        detail: '2026.10.21 14:30:12',
        tone: 'done',
      },
      {
        key: 'register',
        label: '외부 등록',
        detail: '2026.10.21 14:30:15',
        tone: 'done',
      },
      {
        key: 'payment',
        label: '결제 대기',
        detail: '2시간 남음 · 2026.10.22 14:30:15까지',
        tone: 'warn',
      },
      { key: 'reserved', label: '예약 확정', detail: '—', tone: 'todo' },
    ],
  },
}

/** 모두 끝남 */
export const Confirmed: Story = {
  args: {
    steps: [
      {
        key: 'received',
        label: '접수',
        detail: '2026.10.21 14:30:12',
        tone: 'done',
      },
      {
        key: 'register',
        label: '외부 등록',
        detail: '2026.10.21 14:30:15',
        tone: 'done',
      },
      { key: 'payment', label: '결제 완료', detail: '—', tone: 'done' },
      {
        key: 'reserved',
        label: '예약 확정',
        detail: '2026.10.21 16:01:20',
        tone: 'done',
      },
    ],
  },
}
