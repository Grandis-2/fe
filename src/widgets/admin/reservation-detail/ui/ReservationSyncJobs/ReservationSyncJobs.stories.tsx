import { expect } from 'storybook/test'

import { ReservationSyncJobs } from './ReservationSyncJobs'

import type { Meta, StoryObj } from '@storybook/react-vite'

const job = {
  syncJobId: '7b2e3f4a-0000-4000-8000-000000000001',
  preorderId: '9f1c2d3e-0000-4000-8000-000000000001',
  jobType: 'REGISTER' as const,
  status: 'DEAD_LETTER' as const,
  attemptCount: 2,
  lastErrorCode: 'HTTP_503',
  deadLetteredAt: '2026-10-08T03:13:45.000Z',
  createdAt: '2026-10-08T03:12:45.000Z',
  updatedAt: '2026-10-08T03:13:45.000Z',
  attempts: [
    {
      attemptNumber: 1,
      actor: 'SYSTEM' as const,
      result: 'FAILED',
      httpStatus: 503,
      errorCode: 'HTTP_503',
      errorMessage: 'Service Unavailable',
      startedAt: '2026-10-08T03:12:46.000Z',
      finishedAt: '2026-10-08T03:12:47.000Z',
    },
    {
      attemptNumber: 2,
      actor: 'SYSTEM' as const,
      result: 'UNKNOWN',
      httpStatus: null,
      errorCode: 'TIMEOUT',
      errorMessage: null,
      startedAt: '2026-10-08T03:13:40.000Z',
      finishedAt: null,
    },
  ],
}

const meta = {
  component: ReservationSyncJobs,
  tags: ['ai-generated'],
  args: { jobs: [job] },
} satisfies Meta<typeof ReservationSyncJobs>

export default meta
type Story = StoryObj<typeof meta>

/** 재처리가 필요한 등록 작업 — 어떤 오류로 실패했는지 시도마다 보여준다 */
export const DeadLetter: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/외부 등록 · 재처리 필요/)).toBeVisible()
    await expect(canvas.getByText('시도 2회')).toBeVisible()
    await expect(
      canvas.getByText('HTTP_503 — Service Unavailable'),
    ).toBeVisible()
  },
}

export const Empty: Story = {
  args: { jobs: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('연동 기록이 없습니다.')).toBeVisible()
  },
}
