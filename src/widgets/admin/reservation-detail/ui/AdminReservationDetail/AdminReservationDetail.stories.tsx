import { expect } from 'storybook/test'

import { closeModal, useModalStore } from '@shared/model/modalStore'

import { AdminReservationDetail } from './AdminReservationDetail'

import type { AdminReservationDetailProps } from './AdminReservationDetail'
import type { Meta, StoryObj } from '@storybook/react-vite'

type Reservation = AdminReservationDetailProps['reservation']

const base: Reservation = {
  preorderId: '9f1c2d3e-4a5b-4c7d-8e9f-000000000012',
  productId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  productTitle: '갤럭시 Z 폴드8',
  optionId: '9b2d3c4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f',
  optionTitle: '512GB 실버 섀도우',
  unitPrice: 2_399_000,
  status: 'REGISTERED',
  displayStatus: 'PAYABLE',
  queuePosition: 412,
  shipmentBatch: {
    batchNumber: 1,
    positionFrom: 1,
    positionTo: 1000,
    estimatedShipStart: '2026-11-02',
    estimatedShipEnd: '2026-11-06',
  },
  createdAt: '2026-10-08T03:12:45.000Z',
  payableFrom: '2026-10-08T03:12:47.000Z',
  paymentDueAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  reservedAt: null,
  version: 2,
  externalReference: 'R-20261008-0048213579',
  cancelable: true,
  customerId: '5d1c2e3f-4a5b-4c6d-8e7f-000000001001',
  customerName: '이**',
  internalNote: null,
  registerJobStatus: 'SUCCEEDED',
  syncJobs: [],
  events: [
    {
      eventSequence: 1,
      fromStatus: null,
      toStatus: 'PENDING_SYNC',
      actor: 'USER',
      reason: null,
      createdAt: '2026-10-08T03:12:45.000Z',
    },
  ],
}

const meta = {
  component: AdminReservationDetail,
  tags: ['ai-generated'],
  args: { reservation: base },
} satisfies Meta<typeof AdminReservationDetail>

export default meta
type Story = StoryObj<typeof meta>

/** 결제 대기 — 취소는 되고 재처리할 건 없다 */
export const PaymentPending: Story = {
  play: async ({ canvas }) => {
    // 회원 이름은 상세 응답의 가린 이름(customerName)을 그대로 쓴다.
    await expect(canvas.getByText(/^이\*\* · /)).toBeVisible()
    await expect(canvas.getByText('확정')).toBeVisible()
    await expect(canvas.getByText('결제 대기')).toBeVisible()
    await expect(canvas.getByText(/시간 남음/)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '예약 취소' }),
    ).toBeEnabled()
    await expect(canvas.queryByRole('button', { name: '재처리' })).toBeNull()
    await expect(
      canvas.getByText('1차 · 2026.11.02 ~ 2026.11.06'),
    ).toBeVisible()
  },
}

/** 외부 등록이 끝내 실패 — 재처리 버튼이 생긴다 */
export const ReprocessNeeded: Story = {
  args: {
    reservation: {
      ...base,
      status: 'PENDING_SYNC',
      displayStatus: 'PROCESSING',
      payableFrom: null,
      paymentDueAt: null,
      externalReference: null,
      registerJobStatus: 'DEAD_LETTER',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('외부 등록 실패')[0]).toBeVisible()
    await expect(canvas.getByRole('button', { name: '재처리' })).toBeVisible()
  },
}

/** 취소된 예약 — 조치 버튼이 없다 */
export const Canceled: Story = {
  args: {
    reservation: {
      ...base,
      status: 'CANCELED',
      displayStatus: 'CANCELED',
      paymentDueAt: null,
      cancelable: false,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: '예약 취소' })).toBeNull()
    await expect(canvas.queryByRole('button', { name: '재처리' })).toBeNull()
  },
}

/** 외부 취소가 다 실패해 취소 중에 멈췄다 — 다시 보내거나, 외부에서 확인한 뒤 끝낸다 */
export const CancelStuck: Story = {
  args: {
    reservation: {
      ...base,
      status: 'CANCELING',
      displayStatus: 'CANCELING',
      paymentDueAt: null,
      cancelable: false,
      syncJobs: [
        ...base.syncJobs,
        {
          syncJobId: '5a6b7c8d-0000-4000-8000-000000000001',
          preorderId: base.preorderId,
          jobType: 'CANCEL',
          status: 'DEAD_LETTER',
          attemptCount: 3,
          lastErrorCode: 'HTTP_503',
          deadLetteredAt: '2026-10-08T05:20:00Z',
          createdAt: '2026-10-08T05:10:00Z',
          updatedAt: '2026-10-08T05:20:00Z',
          attempts: [],
        },
      ],
    },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByText(/취소를 보내지 못해 취소 중에 멈춰 있어요/),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '다시 보내기' }),
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: '취소 확인 후 끝내기' }),
    )
    // 사유를 받는 확인 창이 열린다 — 확인한 내용 없이는 끝낼 수 없다.
    await expect(useModalStore.getState().isOpen).toBe(true)
    closeModal()
  },
}
