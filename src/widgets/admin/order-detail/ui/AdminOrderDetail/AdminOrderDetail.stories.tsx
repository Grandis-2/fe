import { expect } from 'storybook/test'

import { useModalStore } from '@shared/model/modalStore'

import { AdminOrderDetail } from './AdminOrderDetail'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 목업 시드의 당첨 주문(결제 완료) — 배송 단계 요청은 MSW가 받는다.
const order = {
  orderId: '50000000-0000-4000-8000-000000001002',
  customerId: '5d1c2e3f-4a5b-4c6d-8e7f-000000001004',
  status: 'AWAITING_CONFIRMATION' as const,
  source: 'DRAW' as const,
  totalAmount: 0,
  paymentDueAt: null,
  items: [
    {
      productId: '20000003-0000-4000-8000-000000000000',
      optionId: '30000003-0000-4000-8000-000000000000',
      productTitle: '갤럭시 워치 클래식',
      optionTitle: '티타늄 실버',
      unitPrice: 0,
      quantity: 1,
      warrantyQuantity: 0,
      warrantyUnitPrice: 0,
      lineAmount: 0,
    },
  ],
  shipTo: {
    name: '정하람',
    phone: '01012345678',
    postalCode: '06234',
    line1: '서울특별시 강남구 테헤란로 123',
    line2: '102호',
  },
  createdAt: '2026-10-16T01:00:00Z',
  events: [
    {
      eventSequence: 1,
      fromStatus: null,
      toStatus: 'AWAITING_CONFIRMATION' as const,
      actor: 'SYSTEM' as const,
      reason: 'DRAW_WON',
      createdAt: '2026-10-16T01:00:00Z',
    },
  ],
  refundFailed: false,
}

const meta = {
  component: AdminOrderDetail,
  tags: ['ai-generated'],
  args: { order },
} satisfies Meta<typeof AdminOrderDetail>

export default meta
type Story = StoryObj<typeof meta>

/** 결제 완료(당첨) — 다음 단계 하나만 버튼으로 두고, 누르면 사유를 받는 모달을 연다 */
export const AwaitingConfirmation: Story = {
  beforeEach: () => () => useModalStore.getState().close(),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '배송 준비 시작' }),
    )
    const { isOpen, content } = useModalStore.getState()
    await expect(isOpen).toBe(true)
    await expect(content?.title).toBe('배송 준비 시작')
  },
}

/** 배송 완료면 더 누를 단계가 없다 */
export const Delivered: Story = {
  args: { order: { ...order, status: 'DELIVERED' } },
  play: async ({ canvas }) => {
    // 상태 태그와 진행 칸에 같이 나온다.
    await expect(canvas.getAllByText('배송 완료')[0]).toBeVisible()
    await expect(
      canvas.queryByRole('button', { name: /배송|포장|출고/ }),
    ).toBeNull()
  },
}

/** 결제 전이면 배송을 시작할 수 없다고 알린다 */
export const AwaitingPayment: Story = {
  args: {
    order: { ...order, source: 'CART', status: 'AWAITING_PAYMENT' },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('결제가 끝나야 배송을 시작할 수 있어요'),
    ).toBeVisible()
  },
}

/** 취소 중 환불이 실패했으면 경고한다 */
export const RefundFailed: Story = {
  args: { order: { ...order, status: 'CANCELING', refundFailed: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/환불이 실패했어요/)).toBeVisible()
  },
}
