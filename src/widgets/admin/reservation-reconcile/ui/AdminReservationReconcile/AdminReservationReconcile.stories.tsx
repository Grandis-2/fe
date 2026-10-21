import { expect } from 'storybook/test'

import { AdminReservationReconcile } from './AdminReservationReconcile'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminReservationReconcile,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminReservationReconcile>

export default meta
type Story = StoryObj<typeof meta>

/** 들어오면 저절로 한 번 대조한다 — 건수는 따로 카드 없이 유형 탭에 붙는다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: '외부 예약 대조' }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: /대조/ }),
    ).toBeInTheDocument()
    // 탭과(대조 결과에 있으면) 유형 태그에 같은 이름이 있다.
    await expect(canvas.getAllByText(/외부 취소 안 됨/).length).toBeGreaterThan(
      0,
    )
  },
}
