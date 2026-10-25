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

/** 처리 대기 — 지금 할 일을 말하고, 되돌리기·버리기가 다 보이고 원문은 JSON으로 펼친다 */
export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: '결제 완료 반영' }),
    ).toBeVisible()
    await expect(
      canvas.getByText('처리 중 오류로 5번 받고 멈췄어요'),
    ).toBeVisible()
    await expect(canvas.getByText('messageId 복사')).toBeVisible()
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
    await expect(
      canvas.getByRole('button', { name: '사유 쓰고 버리기' }),
    ).toBeVisible()
    await expect(
      canvas.getByText('원문이 깨져 되돌려도 또 실패해요'),
    ).toBeVisible()
    await expect(
      canvas.getByText(/JSON으로 읽을 수 없는 원문이라 받은 그대로/),
    ).toBeVisible()
  },
}

/** 버린 메시지 — 되돌리기·버리기 없이 기록만 남는다 */
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
    await expect(
      canvas.queryByRole('button', { name: /되돌리기|버리기/ }),
    ).toBeNull()
    await expect(canvas.getByText(/"중복 발행된 메시지"/)).toBeVisible()
    await expect(canvas.getByText(/버림 — 중복 발행된 메시지/)).toBeVisible()
  },
}

/** 다시 실패 — 이 메시지는 기록이고, 새 메시지에서 이어서 처리하라고 알린다 */
export const RedriveFailed: Story = {
  args: {
    deadLetter: {
      ...deadLetter,
      status: 'REDRIVE_FAILED',
      redrivable: false,
      redriveRequestedBy: 'admin',
      redriveStartedAt: '2026-10-08T04:38:00.000Z',
      redrivenAt: '2026-10-08T04:39:00.000Z',
      outcomeAt: '2026-10-08T04:40:00.000Z',
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('되돌렸지만 또 실패해 새 메시지로 다시 쌓였어요'),
    ).toBeVisible()
    await expect(canvas.getByText('처리 결과 · 다시 실패')).toBeVisible()
  },
}
