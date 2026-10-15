import { expect } from 'storybook/test'

import { AdminReservationReconcile } from './AdminReservationReconcile'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: AdminReservationReconcile,
  tags: ['ai-generated'],
  args: { productNames: new Map() },
} satisfies Meta<typeof AdminReservationReconcile>

export default meta
type Story = StoryObj<typeof meta>

/** 들어오면 저절로 한 번 대조한다 — 그동안 카드는 숫자 대신 '대조 중'을 보인다 */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: /대조/ }),
    ).toBeInTheDocument()
    // 카드와 탭에 같은 이름이 둘 다 있다.
    await expect(canvas.getAllByText('외부 취소 안 됨')).toHaveLength(2)
  },
}
