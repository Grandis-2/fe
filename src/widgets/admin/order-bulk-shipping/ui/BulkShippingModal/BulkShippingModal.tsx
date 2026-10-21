import { useEffect, useRef, useState } from 'react'

import { Link } from 'react-router'

import {
  adminOrderSourceLabel,
  adminOrderStatusLabel,
  orderNo,
  SHIPPING_REASON_MAX,
  useAdvanceShippingBatch,
  type AdminOrder,
  type NextShippingStep,
  type ShippingBatchResult,
} from '@entities/admin-order'
import { adminOrderPath } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { showToast } from '@shared/model/toastStore'
import { Button, InlineAlert, Modal, ReasonForm } from '@shared/ui'

import * as styles from './BulkShippingModal.css'

export type BulkShippingModalProps = {
  open: boolean
  /** 고른 주문 — 모두 같은 상태라 다음 단계가 하나다 */
  orders: readonly Pick<AdminOrder, 'orderId' | 'source'>[]
  step: NextShippingStep
  /** @param finished 한 건이라도 보냈으면 true — 고른 것을 풀 때 쓴다 */
  onClose: (finished: boolean) => void
  /** 결과 창의 '다음 단계 탭으로' */
  onShowNext: () => void
}

const countOf = (results: ShippingBatchResult[], kind: string) =>
  results.filter(({ outcome }) => outcome.kind === kind).length

/**
 * 고른 주문을 같은 배송 단계로 옮긴다 — 확인(사유 한 번) → 진행 → 결과가 한 창에서 바뀐다.
 * 일괄 API가 없어 이 창이 한 건씩 보내므로, 닫거나 떠나면 남은 건은 보내지 않는다.
 */
export function BulkShippingModal({
  open,
  orders,
  step,
  onClose,
  onShowNext,
}: BulkShippingModalProps) {
  const batch = useAdvanceShippingBatch()
  const [results, setResults] = useState<ShippingBatchResult[]>([])
  const [reason, setReason] = useState('')
  const [stopping, setStopping] = useState(false)
  const stopRef = useRef(false)

  const running = batch.isPending
  const toLabel = adminOrderStatusLabel[step.to]
  const total = orders.length

  // 이 창이 보내고 있어서, 새로 고치거나 탭을 닫으면 남은 건이 빠진다.
  useEffect(() => {
    if (!running) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [running])

  const run = (orderIds: string[], why: string) => {
    // 다시 보내는 건은 지난 결과를 지우고 새 결과로 채운다.
    const kept = results.filter(({ orderId }) => !orderIds.includes(orderId))
    stopRef.current = false
    setStopping(false)
    setReason(why)
    setResults(kept)
    batch.mutate({
      orderIds,
      step: step.step,
      reason: why,
      onProgress: (done) => setResults([...kept, ...done]),
      shouldStop: () => stopRef.current,
    })
  }

  const stop = () => {
    stopRef.current = true
    setStopping(true)
  }

  const moved = countOf(results, 'moved')
  const already = countOf(results, 'already')
  const rejected = results.flatMap(({ orderId, outcome }) =>
    outcome.kind === 'rejected' ? [{ orderId, reason: outcome.reason }] : [],
  )
  const unknown = countOf(results, 'unknown')
  const sentIds = new Set(results.map(({ orderId }) => orderId))
  const notSent = total - sentIds.size
  // 응답을 못 받은 건과 멈춰서 안 보낸 건 — 같은 요청은 두 번 반영되지 않아 다시 보내도 된다.
  const retryIds = orders
    .map(({ orderId }) => orderId)
    .filter(
      (orderId) =>
        !sentIds.has(orderId) ||
        results.some(
          (it) => it.orderId === orderId && it.outcome.kind === 'unknown',
        ),
    )

  const close = () => {
    // 보내는 중엔 닫지 않고 멈춘다 — 멈추면 결과 창으로 바뀐다.
    if (running) {
      stop()
      return
    }
    if (results.length > 0)
      showToast(
        [
          `${formatNumber(moved + already)}건을 '${toLabel}'(으)로 옮겼습니다.`,
          total - moved - already > 0 &&
            `${formatNumber(total - moved - already)}건은 옮기지 못했습니다.`,
        ]
          .filter(Boolean)
          .join(' '),
      )
    onClose(results.length > 0)
  }

  const modal = { open, onClose: close, theme: 'light' } as const

  if (running) {
    const ok = moved + already
    const bad = rejected.length + unknown
    const percent = (count: number) => `${(count / total) * 100}%`
    return (
      <Modal {...modal} title="주문을 옮기는 중이에요">
        <div className={styles.big} role="status" aria-live="polite">
          <span className={styles.bigValue}>
            {formatNumber(results.length)}
          </span>
          <span className={styles.bigTotal}>/ {formatNumber(total)}건</span>
        </div>
        <div className={styles.progress}>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label="옮기는 중"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={results.length}
          >
            <span className={styles.barOk} style={{ width: percent(ok) }} />
            <span className={styles.barBad} style={{ width: percent(bad) }} />
          </div>
          <div className={styles.progressMeta}>
            <span>
              옮김 {formatNumber(ok)} · 못 옮김 {formatNumber(bad)}
            </span>
            <span>남은 {formatNumber(total - results.length)}건</span>
          </div>
        </div>
        <InlineAlert status="warning">
          이 창에서 보내고 있어요. 창을 닫거나 페이지를 떠나면 남은 건은 보내지
          않아요.
        </InlineAlert>
        <div className={styles.actions}>
          <Button
            variant="outline"
            color="cancel"
            disabled={stopping}
            onClick={stop}
          >
            {stopping ? '멈추는 중…' : '남은 건 멈추기'}
          </Button>
        </div>
      </Modal>
    )
  }

  if (batch.isSuccess) {
    const done = moved + already
    if (done === total) {
      return (
        <Modal
          {...modal}
          title={`${formatNumber(total)}건을 '${toLabel}'(으)로 옮겼어요`}
          description={
            already > 0
              ? `${formatNumber(already)}건은 이미 '${toLabel}'이라 그대로 뒀어요.`
              : undefined
          }
        >
          <div className={styles.actions}>
            <Button
              onClick={() => {
                close()
                onShowNext()
              }}
            >
              '{toLabel}' 보기
            </Button>
            <Button variant="outline" color="cancel" onClick={close}>
              닫기
            </Button>
          </div>
        </Modal>
      )
    }

    return (
      <Modal
        {...modal}
        title={`${formatNumber(total - done)}건은 옮기지 못했어요`}
      >
        <dl className={styles.box}>
          <div className={styles.row}>
            <dt>옮김</dt>
            <dd className={styles.value}>{formatNumber(done)}건</dd>
          </div>
          {rejected.length > 0 && (
            <div className={styles.row}>
              <dt>못 옮김</dt>
              <dd className={styles.dangerValue}>
                {formatNumber(rejected.length)}건
              </dd>
            </div>
          )}
          {unknown > 0 && (
            <div className={styles.row}>
              <dt>응답 없음</dt>
              <dd className={styles.dangerValue}>{formatNumber(unknown)}건</dd>
            </div>
          )}
          {notSent > 0 && (
            <div className={styles.row}>
              <dt>멈춰서 안 보냄</dt>
              <dd className={styles.value}>{formatNumber(notSent)}건</dd>
            </div>
          )}
        </dl>

        {rejected.length > 0 && (
          <ul className={styles.box} aria-label="못 옮긴 주문">
            {rejected.map((it) => (
              <li key={it.orderId} className={styles.row}>
                {/* 새 탭으로 — 결과 창을 잃지 않게 */}
                <Link
                  to={adminOrderPath(it.orderId)}
                  target="_blank"
                  className={styles.orderLink}
                >
                  {orderNo(it.orderId)}
                </Link>
                <span className={styles.reason}>{it.reason}</span>
              </li>
            ))}
          </ul>
        )}

        {unknown > 0 && (
          <InlineAlert status="error">
            서버에 닿지 못했거나 응답이 오지 않았어요. 일부는 이미 옮겨졌을 수
            있어요. 다시 보내도 두 번 옮겨지지 않아요.
          </InlineAlert>
        )}

        <div className={styles.actions}>
          {retryIds.length > 0 && (
            <Button onClick={() => run(retryIds, reason)}>
              {formatNumber(retryIds.length)}건 다시 보내기
            </Button>
          )}
          <Button variant="outline" color="cancel" onClick={close}>
            닫기
          </Button>
        </div>
      </Modal>
    )
  }

  const bySource = [...new Set(orders.map(({ source }) => source))].map(
    (source) => ({
      label: adminOrderSourceLabel[source],
      count: orders.filter((order) => order.source === source).length,
    }),
  )
  return (
    <Modal
      {...modal}
      title={`${formatNumber(total)}건을 '${toLabel}'(으)로 옮길까요?`}
      description="한 건씩 차례로 옮겨요. 단계는 되돌릴 수 없어요."
    >
      {bySource.length > 1 && (
        <dl className={styles.box}>
          <span className={styles.boxTitle}>출처별</span>
          {bySource.map(({ label, count }) => (
            <div key={label} className={styles.row}>
              <dt>{label}</dt>
              <dd className={styles.value}>{formatNumber(count)}건</dd>
            </div>
          ))}
        </dl>
      )}
      <ReasonForm
        label={`처리 사유 — ${formatNumber(total)}건에 같이 남아요`}
        defaultValue={step.defaultReason}
        maxLength={SHIPPING_REASON_MAX}
        confirmLabel={`${formatNumber(total)}건 ${step.label}`}
        onCancel={close}
        onConfirm={(why) =>
          run(
            orders.map(({ orderId }) => orderId),
            why,
          )
        }
      />
    </Modal>
  )
}
