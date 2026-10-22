import { expect, fn, waitFor } from 'storybook/test'

import { ApiRequestError } from '@shared/api/client'

import { ReprocessModal } from './ReprocessModal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const run = {
  target: 860,
  skipped: 0,
  estimatedSeconds: 43,
  startedAt: 0,
  scope: null,
  inFlightAtStart: 0,
}
const progress = (failed: number, sent = 860) => ({
  sent,
  remainingSeconds: 0,
  finished: true,
  failed,
  succeeded: 860 - failed,
  mostlyFailed: failed * 2 >= 860,
})

const meta = {
  component: ReprocessModal,
  tags: ['ai-generated'],
  args: {
    open: true,
    onClose: fn(),
    onConfirm: fn(),
    scopeName: null,
    failures: 860,
    breakdown: [
      { name: '아이폰 18 Pro', count: 812 },
      { name: '갤럭시 Z 폴드8', count: 48 },
    ],
    run: null,
    running: null,
    result: null,
    isPending: false,
    error: null,
    reservationsPath: '/admin/reservations?status=REPROCESS_NEEDED',
  },
} satisfies Meta<typeof ReprocessModal>

export default meta
type Story = StoryObj<typeof meta>

/** 1 · 확인 — 사전예약별 건수와 예상 시간. 버튼에 건수를 넣는다 */
export const Confirm: Story = {
  play: async ({ canvas, args, userEvent }) => {
    // 모달은 열리면서 투명도가 올라오므로 다 보일 때까지 기다린다.
    const row = await canvas.findByText('아이폰 18 Pro')
    await waitFor(() => expect(row).toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: '860건 재처리' }))
    await expect(args.onConfirm).toHaveBeenCalled()
  },
}

/** 요청을 보내는 중엔 다시 누를 수 없다 */
export const Pending: Story = { args: { isPending: true } }

/** 요청 실패 — 확인 화면 그대로 오류를 띄우고 다시 시도하게 한다 */
export const RequestFailed: Story = {
  args: {
    error: new ApiRequestError(
      { code: 'INTERNAL_ERROR', message: '서버 오류', details: null },
      500,
    ),
  },
}

/** 다른 관리자가 먼저 처리했다(409) — 오류가 아니라 안내 */
export const NothingToReprocess: Story = {
  args: {
    error: new ApiRequestError(
      {
        code: 'NOTHING_TO_REPROCESS',
        message: '재처리할 작업이 없습니다.',
        details: null,
      },
      409,
    ),
  },
}

/** 2 · 진행 — 닫아도 서버에서 계속된다 */
export const Running: Story = {
  args: {
    run,
    running: { ...progress(0, 448), remainingSeconds: 20, finished: false },
  },
}

/** 3 · 모두 성공 */
export const AllDone: Story = { args: { run, result: progress(0) } }

/** 3-b · 몇 건만 또 실패 — 예약 현황에서 하나씩 보게 한다 */
export const FewFailed: Story = { args: { run, result: progress(12) } }

/** 3-c · 대부분 또 실패 — 외부 시스템 문제로 안내하고 다시 보내라고 권하지 않는다 */
export const MostlyFailed: Story = {
  args: { run, result: progress(790) },
  play: async ({ canvas }) => {
    const notice = await canvas.findByText(/개발팀에 알려 주세요/)
    await waitFor(() => expect(notice).toBeVisible())
  },
}
