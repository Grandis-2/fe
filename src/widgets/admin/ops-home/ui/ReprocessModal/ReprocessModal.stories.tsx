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
  deadLetterAtStart: 900,
}
// 집계 시각이 예상 시간을 넘은 뒤의 값 — 줄어든 건수만 말한다.
const progress = (deadLetterNow: number, sent = 860) => ({
  sent,
  remainingSeconds: 0,
  finished: true,
  deadLetterAtStart: 900,
  deadLetterNow,
  reduced: 900 - deadLetterNow,
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

/** 요청을 보내는 중엔 다시 누를 수 없다 — 묶음을 차례로 보내서 오래 걸린다 */
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

/** 부분 실패 — 앞 묶음은 접수됐고 나머지는 보내지 못했다(다시 누르면 보내지 못한 건만) */
export const PartialFailure: Story = {
  args: {
    error: new ApiRequestError(
      {
        code: 'REPROCESS_PARTIAL',
        message:
          '재처리 1000건은 접수했고 500건은 보내지 못했어요. 보내지 못한 건만 다시 보낼 수 있어요.',
        details: null,
      },
      409,
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
    running: {
      sent: 448,
      remainingSeconds: 20,
      finished: false,
      deadLetterAtStart: 900,
      deadLetterNow: null,
      reduced: null,
    },
  },
}

/** 3 · 끝남 — 재처리 필요가 얼마나 줄었는지와 예약 현황으로 가는 길 */
export const Reduced: Story = { args: { run, result: progress(40) } }

/** 3-b · 끝났는데 안 줄었다 — 외부 등록이 계속 실패하는지 확인하라고 안내 */
export const NotReduced: Story = {
  args: { run, result: progress(900) },
  play: async ({ canvas }) => {
    const notice = await canvas.findByText(/아직 줄지 않았어요/)
    await waitFor(() => expect(notice).toBeVisible())
  },
}
