import { useState } from 'react'

import {
  adminOrderSourceLabel,
  adminOrderStatusColor,
  adminOrderStatusLabel,
  nextShippingStepOf,
  orderNo,
  SHIPPING_REASON_MAX,
  useAdvanceShipping,
  type AdminOrderRecord,
  type AdminOrderStatus,
  type NextShippingStep,
} from '@entities/admin-order'
import { useAdminMembers } from '@entities/admin-reservation'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { formatPhoneInput } from '@shared/lib/formatPhone'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import { Button, FormSection, InlineAlert, ReasonForm, Tag } from '@shared/ui'

import { OrderTimeline } from '../OrderTimeline'

import * as styles from './AdminOrderDetail.css'

export type AdminOrderDetailProps = {
  order: AdminOrderRecord
}

const isOrderStatus = (value: unknown): value is AdminOrderStatus =>
  typeof value === 'string' && Object.hasOwn(adminOrderStatusLabel, value)

/** 배송을 못 옮긴 까닭. 409면 서버가 알려 준 지금 상태로 말한다 */
function stepFailureMessage(caught: unknown) {
  if (
    caught instanceof ApiRequestError &&
    caught.error.code === 'ORDER_STEP_NOT_ALLOWED'
  ) {
    const current = caught.error.details?.status
    return isOrderStatus(current)
      ? `주문이 이미 '${adminOrderStatusLabel[current]}' 상태라 옮기지 못했습니다. 지금 상태로 다시 불러왔습니다.`
      : '지금 상태에서는 이 단계로 옮길 수 없습니다. 지금 상태로 다시 불러왔습니다.'
  }
  return getErrorMessage(caught, '배송 단계를 옮기지 못했습니다.')
}

/**
 * 주문 한 건의 배송 처리. 단계는 건너뛸 수 없어 지금 상태에서 갈 수 있는 다음 단계 하나만
 * 버튼으로 둔다. 사유는 관리자 이력에만 남는다.
 */
export function AdminOrderDetail({ order }: AdminOrderDetailProps) {
  const advance = useAdvanceShipping()
  const { data: members } = useAdminMembers([order.customerId])
  const memberName = members?.find(
    (member) => member.memberId === order.customerId,
  )?.name
  const [failure, setFailure] = useState<string | null>(null)
  const next = nextShippingStepOf(order.status)

  const confirmStep = (target: NextShippingStep) =>
    openModal({
      theme: 'light',
      title: target.label,
      description: `주문 ${orderNo(order.orderId)}을(를) '${adminOrderStatusLabel[target.to]}'(으)로 옮깁니다. 단계는 되돌릴 수 없습니다.`,
      children: (
        <ReasonForm
          label="처리 사유"
          defaultValue={target.defaultReason}
          maxLength={SHIPPING_REASON_MAX}
          confirmLabel={target.label}
          onCancel={closeModal}
          onConfirm={(reason) => {
            closeModal()
            setFailure(null)
            advance.mutate(
              { orderId: order.orderId, step: target.step, reason },
              {
                onSuccess: ({ applied }) =>
                  showToast(
                    applied
                      ? `${target.label} 처리했습니다.`
                      : '이미 처리된 단계입니다.',
                  ),
                onError: (caught) => setFailure(stepFailureMessage(caught)),
              },
            )
          }}
        />
      ),
    })

  const { shipTo } = order
  const infoRows = [
    { label: '주문 id', value: order.orderId },
    { label: '출처', value: adminOrderSourceLabel[order.source] },
    { label: '주문 시각', value: formatDotDateTime(order.createdAt) },
    { label: '회원', value: memberName ?? '—' },
    { label: '회원 id', value: order.customerId },
  ]

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>주문 {orderNo(order.orderId)}</h1>
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={adminOrderStatusColor[order.status]}
        >
          {adminOrderStatusLabel[order.status]}
        </Tag>
        <Tag variant="outline" size="medium" rounded={false} color="gray">
          {adminOrderSourceLabel[order.source]}
        </Tag>
        {next && (
          <Button
            size="small"
            className={styles.action}
            disabled={advance.isPending}
            onClick={() => confirmStep(next)}
          >
            {advance.isPending ? '처리 중…' : next.label}
          </Button>
        )}
      </div>

      {failure && <InlineAlert status="error">{failure}</InlineAlert>}
      {order.refundFailed && (
        <InlineAlert status="error">
          취소 중 환불이 실패했습니다. 원인은 결제 기록에서 확인해 주세요.
        </InlineAlert>
      )}
      {!next &&
        (order.status === 'AWAITING_PAYMENT' ||
          order.status === 'AUTHORIZING') && (
          <InlineAlert status="info">
            결제가 끝나야 배송을 시작할 수 있습니다.
          </InlineAlert>
        )}

      <FormSection title="주문 상품">
        <div className={styles.card}>
          {order.items.map((item) => (
            <div key={item.optionId} className={styles.item}>
              <div>
                <div className={styles.itemName}>{item.productTitle}</div>
                <div className={styles.itemOption}>
                  {item.optionTitle} · {formatNumber(item.quantity)}개
                  {item.warrantyQuantity > 0 &&
                    ` (보증 ${formatNumber(item.warrantyQuantity)}개)`}
                </div>
              </div>
              <span className={styles.amount}>
                {formatWon(item.lineAmount)}
              </span>
            </div>
          ))}
          <div className={styles.total}>
            <span>합계</span>
            <span>{formatWon(order.totalAmount)}</span>
          </div>
        </div>
      </FormSection>

      <div className={styles.columns}>
        <FormSection title="배송지">
          <dl className={styles.card}>
            {[
              { label: '받는 사람', value: shipTo.name },
              { label: '연락처', value: formatPhoneInput(shipTo.phone) },
              { label: '우편번호', value: shipTo.postalCode },
              {
                label: '주소',
                value: [shipTo.line1, shipTo.line2].filter(Boolean).join(' '),
              },
            ].map(({ label, value }) => (
              <div key={label} className={styles.row}>
                <dt className={styles.term}>{label}</dt>
                <dd className={styles.value}>{value}</dd>
              </div>
            ))}
          </dl>
        </FormSection>

        <FormSection title="주문 정보">
          <dl className={styles.card}>
            {infoRows.map(({ label, value }) => (
              <div key={label} className={styles.row}>
                <dt className={styles.term}>{label}</dt>
                <dd className={styles.value}>{value}</dd>
              </div>
            ))}
          </dl>
        </FormSection>
      </div>

      <FormSection title="상태 이력">
        <div className={styles.card}>
          <OrderTimeline events={order.events} />
        </div>
      </FormSection>
    </div>
  )
}
