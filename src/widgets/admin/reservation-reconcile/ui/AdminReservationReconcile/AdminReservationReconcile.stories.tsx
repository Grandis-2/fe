import { expect } from 'storybook/test'

import { AdminReservationReconcile } from './AdminReservationReconcile'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminReservationReconcile,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminReservationReconcile>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 검사 결과를 못 받은 모습(Storybook엔 API가 없다) — 고치는 방법별 탭과 지금 검사 버튼은
 * 보이고, 표는 실패 문구를 띄운다. 결과·조치 흐름은 e2e(목 서버)에서 본다.
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: '외부 예약 대조' }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: '지금 검사' }),
    ).toBeInTheDocument()
    for (const label of [
      '전체',
      '외부 취소 필요',
      '재처리 필요',
      '예약 취소 필요',
      '수동 조사',
    ]) {
      await expect(canvas.getByRole('button', { name: label })).toBeVisible()
    }
  },
}
