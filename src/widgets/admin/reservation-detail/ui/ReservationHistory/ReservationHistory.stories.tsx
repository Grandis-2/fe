import { expect } from 'storybook/test'

import { ReservationHistory } from './ReservationHistory'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReservationHistory,
  tags: ['ai-generated'],
  args: {
    entries: [
      {
        key: 'job-2',
        kind: 'sync',
        at: '2026-10-21T05:31:40.000Z',
        title: '외부 등록 시도 2 · 실패',
        actor: '자동',
        error: 'EXT_TIMEOUT — 외부 예약 시스템 응답 없음',
      },
      {
        key: 'job-1',
        kind: 'sync',
        at: '2026-10-21T05:30:20.000Z',
        title: '외부 등록 시도 1 · 실패',
        actor: '자동',
        error: 'EXT_UNAVAILABLE — HTTP 503',
      },
      {
        key: 'event-1',
        kind: 'status',
        at: '2026-10-21T05:30:12.000Z',
        title: '접수',
        actor: '회원',
      },
    ],
  },
} satisfies Meta<typeof ReservationHistory>

export default meta
type Story = StoryObj<typeof meta>

/** 전체 — 상태 변경과 외부 연동이 시간순으로 섞인다 */
export const All: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3)
    await userEvent.click(canvas.getByRole('button', { name: '상태 변경' }))
    await expect(canvas.getAllByRole('listitem')).toHaveLength(1)
  },
}

export const Empty: Story = { args: { entries: [] } }
