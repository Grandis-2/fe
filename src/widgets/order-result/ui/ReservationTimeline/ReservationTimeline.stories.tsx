import { expect } from 'storybook/test'

import { ReservationTimeline } from './ReservationTimeline'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReservationTimeline,
  tags: ['ai-generated'],
} satisfies Meta<typeof ReservationTimeline>

export default meta
type Story = StoryObj<typeof meta>

const accepted = {
  eventSequence: 1,
  fromStatus: null,
  toStatus: 'PENDING_SYNC',
  actor: 'USER',
  reason: null,
  createdAt: '2026-10-25T03:00:00.120Z',
} as const

// 접수만 됐고 외부 등록을 기다리는 중 — 마지막에 '등록하는 중' 줄이 붙는다.
export const Registering: Story = {
  args: { events: [accepted], registering: true },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2)
    await expect(
      canvas.getByText('외부 예약 시스템에 등록하는 중'),
    ).toBeVisible()
  },
}

// 등록이 끝났다 — 접수에서 등록까지 걸린 시간이 보인다.
export const Registered: Story = {
  args: {
    events: [
      accepted,
      {
        eventSequence: 2,
        fromStatus: 'PENDING_SYNC',
        toStatus: 'REGISTERED',
        actor: 'SYSTEM',
        reason: null,
        createdAt: '2026-10-25T03:00:03.480Z',
      },
    ],
    registering: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('외부 예약 시스템 등록 완료')).toBeVisible()
    await expect(canvas.getByText('시스템 · +3.4초')).toBeVisible()
  },
}

// 처리 중에 운영자가 취소했다(외부 등록 실패).
export const CanceledByAdmin: Story = {
  args: {
    events: [
      accepted,
      {
        eventSequence: 2,
        fromStatus: 'PENDING_SYNC',
        toStatus: 'CANCELING',
        actor: 'ADMIN',
        reason: '외부 등록 실패',
        createdAt: '2026-10-25T03:05:00.120Z',
      },
      {
        eventSequence: 3,
        fromStatus: 'CANCELING',
        toStatus: 'CANCELED',
        actor: 'SYSTEM',
        reason: null,
        createdAt: '2026-10-25T03:05:01.000Z',
      },
    ],
    registering: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('운영자 · +5분')).toBeVisible()
    await expect(canvas.getByText('취소 완료')).toBeVisible()
  },
}
