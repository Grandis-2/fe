import { expect } from 'storybook/test'

import { AdminDeadLetterDetail } from './AdminDeadLetterDetail'

import type { Meta, StoryObj } from '@storybook/react-vite'

const deadLetter = {
  deadLetterId: 'd0000000-0000-4000-8000-000000000001',
  messageId: 'msg-0001',
  eventId: 'e0000000-0000-4000-8000-000000000001',
  eventType: 'PREORDER_PAYMENT_CONFIRMED',
  preorderId: '9f1c2d3e-0000-4000-8000-000000000001',
  customerId: '5d1c2e3f-0000-4000-8000-000000000001',
  failureReason: 'PROCESSING_FAILED' as const,
  receiveCount: 5,
  status: 'OPEN' as const,
  redrivable: true,
  redrivenFromId: null,
  sentAt: '2026-10-08T03:12:45.000Z',
  createdAt: '2026-10-08T03:13:45.000Z',
  updatedAt: '2026-10-08T03:13:45.000Z',
  sourceQueue: 'preorder-events',
  aggregateType: 'PREORDER',
  aggregateId: '9f1c2d3e-0000-4000-8000-000000000001',
  body: '{"eventType":"PREORDER_PAYMENT_CONFIRMED","amount":129000}',
  redriveRequestedBy: null,
  redriveStartedAt: null,
  redrivenAt: null,
  outcomeAt: null,
  discardedBy: null,
  discardedAt: null,
  discardNote: null,
}

const meta = {
  component: AdminDeadLetterDetail,
  tags: ['ai-generated'],
  args: { deadLetter },
} satisfies Meta<typeof AdminDeadLetterDetail>

export default meta
type Story = StoryObj<typeof meta>

/** 처리 대기 — 되돌리기·버리기가 다 보이고 원문은 JSON으로 펼친다 */
export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('결제 완료 반영')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '되돌리기' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: '버리기' })).toBeVisible()
    await expect(canvas.getByText(/"amount": 129000/)).toBeVisible()
    await expect(canvas.getByText('msg-0001')).toBeVisible()
  },
}

/** 원문이 깨진 메시지 — 되돌려도 또 실패해 버리기만 있고, 원문은 그대로 보인다 */
export const Unreadable: Story = {
  args: {
    deadLetter: {
      ...deadLetter,
      eventType: null,
      failureReason: 'UNREADABLE_BODY',
      redrivable: false,
      body: '{"eventType":"PREORDER_PAY',
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('button', { name: '되돌리기' }),
    ).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: '버리기' })).toBeVisible()
    await expect(
      canvas.getByText('JSON으로 읽을 수 없는 원문이라 그대로 보여줍니다.'),
    ).toBeVisible()
  },
}

/** 버린 메시지 — 조치 버튼 없이 기록만 남는다 */
export const Discarded: Story = {
  args: {
    deadLetter: {
      ...deadLetter,
      status: 'DISCARDED',
      redrivable: false,
      discardedBy: 'admin',
      discardedAt: '2026-10-08T04:00:00.000Z',
      discardNote: '중복 발행된 메시지',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
    await expect(canvas.getByText('중복 발행된 메시지')).toBeVisible()
  },
}
