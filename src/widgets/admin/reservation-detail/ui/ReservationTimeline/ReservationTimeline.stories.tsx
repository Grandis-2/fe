import { expect } from 'storybook/test'

import { ReservationTimeline } from './ReservationTimeline'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReservationTimeline,
  tags: ['ai-generated'],
  args: {
    events: [
      {
        eventSequence: 2,
        fromStatus: 'PENDING_SYNC',
        toStatus: 'REGISTERED',
        actor: 'SYSTEM',
        reason: null,
        createdAt: '2026-10-08T03:12:47.000Z',
      },
      {
        eventSequence: 1,
        fromStatus: null,
        toStatus: 'PENDING_SYNC',
        actor: 'USER',
        reason: null,
        createdAt: '2026-10-08T03:12:45.000Z',
      },
      {
        eventSequence: 3,
        fromStatus: 'REGISTERED',
        toStatus: 'CANCELING',
        actor: 'ADMIN',
        reason: '고객 요청 — 콜센터 접수 #20261008-17',
        createdAt: '2026-10-08T05:00:00.000Z',
      },
    ],
  },
} satisfies Meta<typeof ReservationTimeline>

export default meta
type Story = StoryObj<typeof meta>

/** 번호 순으로 쌓고, 관리자 조치는 사유를 함께 보여준다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole('listitem')
    await expect(items[0]).toHaveTextContent('접수')
    await expect(items[1]).toHaveTextContent('접수 → 결제 대기')
    await expect(items[2]).toHaveTextContent('관리자')
    await expect(items[2]).toHaveTextContent('콜센터 접수')
  },
}

export const Empty: Story = {
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('이력이 없습니다.')).toBeVisible()
  },
}
