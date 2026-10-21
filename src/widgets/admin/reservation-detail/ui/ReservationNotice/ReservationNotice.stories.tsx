import { expect } from 'storybook/test'

import { Button } from '@shared/ui'

import { ReservationNotice } from './ReservationNotice'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReservationNotice,
  tags: ['ai-generated'],
  args: {
    tone: 'danger',
    title: '외부 등록에 실패해 결제로 넘어가지 못하고 있어요',
    description: '자동 시도 5회 모두 실패 · 마지막 오류 EXT_TIMEOUT',
    action: <Button size="small">재처리</Button>,
  },
} satisfies Meta<typeof ReservationNotice>

export default meta
type Story = StoryObj<typeof meta>

/** 지금 눌러야 하는 것 — 조치 버튼이 붙는다 */
export const Danger: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '재처리' })).toBeVisible()
  },
}

/** 알아 둘 것 — 할 일은 없다 */
export const Warning: Story = {
  args: {
    tone: 'warning',
    title: '결제 기한이 2시간 남았어요',
    description: '기한까지 결제하지 않으면 자동으로 취소돼요.',
    action: undefined,
  },
}

/** 상황 설명 */
export const Info: Story = {
  args: {
    tone: 'info',
    title: '취소된 예약이에요',
    description: '관리자 취소 · 사유: 고객 요청',
    action: undefined,
  },
}
