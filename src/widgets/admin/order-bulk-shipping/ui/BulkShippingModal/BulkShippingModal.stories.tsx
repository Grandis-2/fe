import { expect, fn, waitFor } from 'storybook/test'

import { nextShippingStepOf } from '@entities/admin-order'

import { BulkShippingModal } from './BulkShippingModal'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: BulkShippingModal,
  tags: ['ai-generated'],
  args: {
    open: true,
    orders: [
      { orderId: '50000000-0000-4000-8000-000000001002', source: 'DRAW' },
      { orderId: '50000000-0000-4000-8000-000000001003', source: 'CART' },
    ],
    step: nextShippingStepOf('AWAITING_CONFIRMATION')!,
    onClose: fn(),
    onShowNext: fn(),
  },
} satisfies Meta<typeof BulkShippingModal>

export default meta
type Story = StoryObj<typeof meta>

/** 확인 — 출처별 건수와 사유(기본 문구). 버튼에 건수와 단계를 넣는다 */
export const Confirm: Story = {
  play: async ({ canvas }) => {
    const button = await canvas.findByRole('button', {
      name: '2건 배송 준비 시작',
    })
    await waitFor(() => expect(button).toBeVisible())
    await expect(canvas.getByText('럭키드로우 당첨')).toBeVisible()
    await expect(
      canvas.getByDisplayValue('배송 준비를 시작합니다.'),
    ).toBeVisible()
  },
}
