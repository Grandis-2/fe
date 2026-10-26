import { Fragment, useState } from 'react'

import { Copy } from 'lucide-react'

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
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { copyText } from '@shared/lib/copyText'
import {
  formatDotDateTime,
  formatShortDateTime,
} from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { formatPhoneInput } from '@shared/lib/formatPhone'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  InlineAlert,
  NoticeBanner,
  ProgressSteps,
  ReasonForm,
  Tag,
} from '@shared/ui'

import { enteredAt, progressSteps } from '../../lib/progress'
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

/** 지금 할 일 띠의 제목 — 다음 단계로 옮길 때가 언제인지 */
const nextStepTitle: Partial<Record<AdminOrderStatus, string>> = {
  AWAITING_CONFIRMATION: '결제가 끝났어요. 배송 준비를 시작해 주세요',
  PREPARING_ITEMS: '포장을 마치면 포장 완료로 옮겨 주세요',
  READY_TO_SHIP: '택배사에 넘기면 출고로 옮겨 주세요',
  SHIPPED: '배송이 끝나면 배송 완료로 옮겨 주세요',
}

const copy = (text: string, what: string) =>
  copyText(text).then(
    () => showToast(`${what}을(를) 복사했습니다.`),
    () => showToast(`${what}을(를) 복사하지 못했습니다.`),
  )

/**
 * 주문 한 건의 배송 처리. 맨 위에 지금 할 일(다음 배송 단계)과 조치, 그 아래 어디까지
 * 왔는지, 아래 두 단에 상품·이력(넓게)과 배송지·주문 정보(좁게)를 둔다. 단계는 건너뛸 수
 * 없어 지금 상태에서 갈 수 있는 다음 단계 하나만 버튼으로 둔다. 사유는 관리자 이력에만 남는다.
 */
export function AdminOrderDetail({ order }: AdminOrderDetailProps) {
  const advance = useAdvanceShipping()
  const [failure, setFailure] = useState<string | null>(null)
  const next = nextShippingStepOf(order.status)
  const number = orderNo(order.orderId)
  const statusLabel = adminOrderStatusLabel[order.status]
  const since = enteredAt(order, order.status)

  const confirmStep = (target: NextShippingStep) =>
    openModal({
      theme: 'light',
      title: target.label,
      description: `주문 ${number}을(를) '${adminOrderStatusLabel[target.to]}'(으)로 옮깁니다. 단계는 되돌릴 수 없습니다.`,
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
  const address = `(${shipTo.postalCode}) ${[shipTo.line1, shipTo.line2].filter(Boolean).join(' ')}`
  const phone = formatPhoneInput(shipTo.phone)

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>주문 {number}</h1>
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={adminOrderStatusColor[order.status]}
        >
          {statusLabel}
        </Tag>
        <Tag variant="outline" size="medium" rounded={false} color="gray">
          {adminOrderSourceLabel[order.source]}
        </Tag>
        <span className={styles.summary}>
          {[
            order.customerName,
            formatWon(order.totalAmount),
            `${formatShortDateTime(order.createdAt)} 주문`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>

      {failure && <InlineAlert status="error">{failure}</InlineAlert>}

      {/* 지금 할 일 — 빨강은 확인이 필요한 문제, 회색은 다음 단계·상황 설명이다. */}
      {/* 취소 완료인데 환불 실패면 결제 확인 실패로 취소한 주문의 자동 환불이 실패한 경우다. */}
      {order.refundFailed && (
        <NoticeBanner
          tone="danger"
          title={
            order.status === 'CANCELED'
              ? '주문은 취소됐지만 환불이 실패했어요'
              : '취소 중 환불이 실패했어요'
          }
          description="원인은 결제 기록에서 확인해 주세요."
        />
      )}
      {next && (
        <NoticeBanner
          tone="info"
          title={nextStepTitle[order.status] ?? next.label}
          description={[
            since && `${formatDotDateTime(since)}부터 '${statusLabel}'`,
            '단계는 건너뛰거나 되돌릴 수 없어요',
          ]
            .filter(Boolean)
            .join(' · ')}
          action={
            <Button
              size="small"
              disabled={advance.isPending}
              onClick={() => confirmStep(next)}
            >
              {advance.isPending ? '처리 중…' : next.label}
            </Button>
          }
        />
      )}
      {(order.status === 'AWAITING_PAYMENT' ||
        order.status === 'AUTHORIZING') && (
        <NoticeBanner
          tone="info"
          title="결제가 끝나야 배송을 시작할 수 있어요"
          description="관리자가 할 일은 없어요."
        />
      )}

      <section className={styles.panel} aria-labelledby="order-progress">
        <h2 id="order-progress" className={styles.panelTitle}>
          진행
        </h2>
        <ProgressSteps steps={progressSteps(order)} />
      </section>

      <div className={styles.columns}>
        <div className={styles.main}>
          <section className={styles.panel} aria-labelledby="order-items">
            <h2 id="order-items" className={styles.panelTitle}>
              주문 상품{' '}
              <span className={styles.panelCount}>
                {formatNumber(order.items.length)}건
              </span>
            </h2>
            <ul className={styles.items}>
              {order.items.map((item) => (
                <li key={item.optionId} className={styles.item}>
                  <div>
                    <div className={styles.itemName}>{item.productTitle}</div>
                    <div className={styles.itemOption}>
                      {item.optionTitle} · {formatWon(item.unitPrice)} ×{' '}
                      {formatNumber(item.quantity)}개
                      {item.warrantyQuantity > 0 &&
                        ` · 보증 ${formatNumber(item.warrantyQuantity)}개`}
                    </div>
                  </div>
                  <span className={styles.amount}>
                    {formatWon(item.lineAmount)}
                  </span>
                </li>
              ))}
            </ul>
            <div className={styles.total}>
              <span>합계</span>
              <span>{formatWon(order.totalAmount)}</span>
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="order-history">
            <h2 id="order-history" className={styles.panelTitle}>
              상태 이력
            </h2>
            <OrderTimeline events={order.events} />
          </section>
        </div>

        <div className={styles.side}>
          <section className={styles.panel} aria-labelledby="order-ship-to">
            <div className={styles.panelHeader}>
              <h2 id="order-ship-to" className={styles.panelTitle}>
                배송지
              </h2>
              <Button
                size="small"
                variant="outline"
                onClick={() =>
                  void copy(`${shipTo.name}\n${phone}\n${address}`, '배송지')
                }
              >
                전체 복사
              </Button>
            </div>
            <dl className={styles.list}>
              <dt className={styles.term}>받는 사람</dt>
              <dd className={styles.value}>{shipTo.name}</dd>
              <dt className={styles.term}>연락처</dt>
              <dd className={styles.value}>{phone}</dd>
              <dt className={styles.term}>주소</dt>
              <dd className={styles.value}>{address}</dd>
            </dl>
          </section>

          <section className={styles.panel} aria-labelledby="order-info">
            <h2 id="order-info" className={styles.panelTitle}>
              주문 정보
            </h2>
            <dl className={styles.list}>
              {[
                { label: '출처', value: adminOrderSourceLabel[order.source] },
                { label: '회원', value: order.customerName ?? '—' },
              ].map(({ label, value }) => (
                <Fragment key={label}>
                  <dt className={styles.term}>{label}</dt>
                  <dd className={styles.value}>{value}</dd>
                </Fragment>
              ))}
              <dt className={styles.term}>주문 id</dt>
              <dd className={styles.idValue}>
                {order.orderId}
                <button
                  type="button"
                  className={styles.copyButton}
                  aria-label="주문 id 복사"
                  onClick={() => void copy(order.orderId, '주문 id')}
                >
                  <Copy className={styles.copyIcon} aria-hidden="true" />
                </button>
              </dd>
              <dt className={styles.term}>회원 id</dt>
              <dd className={styles.idValue}>{order.customerId}</dd>
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
