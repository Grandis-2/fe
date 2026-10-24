import { expect, fn, userEvent } from 'storybook/test'

import { groupDeadLetters, type DeadLetter } from '@entities/admin-dead-letter'

import { DeadLetterGroups } from './DeadLetterGroups'

import type { Meta, StoryObj } from '@storybook/react-vite'

const NOW = Date.parse('2026-10-24T05:30:00Z')

const item = (partial: Partial<DeadLetter>): DeadLetter => ({
  deadLetterId: 'a',
  messageId: 'm',
  eventId: null,
  eventType: 'PREORDER_PAYMENT_CONFIRMED',
  preorderId: null,
  customerId: null,
  failureReason: 'PROCESSING_FAILED',
  receiveCount: 5,
  status: 'OPEN',
  redrivable: true,
  redrivenFromId: null,
  sentAt: null,
  createdAt: '2026-10-24T03:30:00Z',
  updatedAt: '2026-10-24T03:30:00Z',
  ...partial,
})

const meta = {
  component: DeadLetterGroups,
  tags: ['ai-generated'],
  args: {
    now: NOW,
    busy: false,
    onRedrive: fn(),
    onOpen: fn(),
    groups: groupDeadLetters([
      item({ deadLetterId: '1' }),
      item({ deadLetterId: '2' }),
      item({
        deadLetterId: '3',
        eventType: null,
        failureReason: 'UNREADABLE_BODY',
        redrivable: false,
      }),
      item({
        deadLetterId: '4',
        eventType: 'PREORDER_GIFT_GRANTED',
        failureReason: 'UNKNOWN_EVENT_TYPE',
      }),
    ]),
  },
} satisfies Meta<typeof DeadLetterGroups>

export default meta
type Story = StoryObj<typeof meta>

/** 처리 중 오류 묶음은 묶음째 되돌린다 */
export const RedriveGroup: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText(/가장 오래된 것 2시간 전/)).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '묶음 되돌리기 2건' }),
    )
    await expect(args.onRedrive).toHaveBeenCalledWith(['1', '2'])
  },
}

/** 원문을 읽을 수 없으면 되돌리지 않고 원문을 보러 간다 */
export const UnreadableOpensDetail: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText(/되돌려도 또 실패해요/)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '원문 보기' }))
    await expect(args.onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ deadLetterId: '3' }),
    )
  },
}
