import { expect, fn } from 'storybook/test'

import { ReservationDeadLetters } from './ReservationDeadLetters'

import type { Meta, StoryObj } from '@storybook/react-vite'

const base = {
  messageId: 'msg-0001',
  eventId: 'e0000000-0000-4000-8000-000000000001',
  preorderId: '9f1c2d3e-0000-4000-8000-000000000001',
  customerId: '5d1c2e3f-0000-4000-8000-000000000001',
  failureReason: 'PROCESSING_FAILED' as const,
  receiveCount: 5,
  redrivenFromId: null,
  sentAt: '2026-10-08T03:12:45.000Z',
  createdAt: '2026-10-08T03:13:45.000Z',
  updatedAt: '2026-10-08T03:13:45.000Z',
}

const meta = {
  component: ReservationDeadLetters,
  tags: ['ai-generated'],
  args: {
    onRedrive: fn(),
    items: [
      {
        ...base,
        deadLetterId: 'd0000000-0000-4000-8000-000000000001',
        eventType: 'PREORDER_PAYMENT_CONFIRMED',
        status: 'OPEN',
        redrivable: true,
      },
      {
        ...base,
        deadLetterId: 'd0000000-0000-4000-8000-000000000002',
        eventType: 'PREORDER_EXPIRY_REQUESTED',
        status: 'REDRIVEN',
        redrivable: false,
      },
      {
        ...base,
        deadLetterId: 'd0000000-0000-4000-8000-000000000003',
        eventType: null,
        failureReason: 'UNREADABLE_BODY',
        status: 'OPEN',
        redrivable: false,
      },
    ],
  },
} satisfies Meta<typeof ReservationDeadLetters>

export default meta
type Story = StoryObj<typeof meta>

/** 다시 처리할 수 있는 건만 버튼이 있고, 나머지는 할 일을 글로 알린다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('결제 완료 반영')).toBeVisible()
    await expect(canvas.getByText('처리 중입니다')).toBeVisible()
    await expect(canvas.getByText('개발팀 문의')).toBeVisible()
    const buttons = canvas.getAllByRole('button', { name: '다시 처리' })
    await expect(buttons).toHaveLength(1)
    await userEvent.click(buttons[0])
    await expect(args.onRedrive).toHaveBeenCalledWith(args.items[0])
  },
}

/** 보내는 중엔 다시 누를 수 없다 */
export const Busy: Story = {
  args: { busy: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '다시 처리' }),
    ).toBeDisabled()
  },
}
