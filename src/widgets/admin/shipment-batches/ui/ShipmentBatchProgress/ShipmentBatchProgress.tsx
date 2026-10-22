import {
  currentBatchOf,
  formatPositionRange,
  formatShipPeriod,
  issuedInBatch,
  type AdminShipmentBatch,
} from '@entities/admin-product'
import { formatNumber } from '@shared/lib/formatNumber'
import { Table, Tag } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './ShipmentBatchProgress.css'

export type ShipmentBatchProgressProps = {
  batches: AdminShipmentBatch[]
  /** 지금까지 발급한 순번 수(취소 포함). 회차를 못 받았으면 undefined — 막대 없이 표만 */
  issuedCount: number | undefined
  /** 접수 중인지 — 마감 뒤에는 '접수 중' 차수가 없다 */
  accepting: boolean
}

// 상한 없는 마지막 차수의 막대 폭 — 아직 차지 않은 꼬리라 앞 차수 평균만큼만 둔다.
const openEndWeight = (batches: AdminShipmentBatch[], issuedCount: number) => {
  const sized = batches.filter((batch) => batch.positionTo !== null)
  const average =
    sized.reduce(
      (sum, batch) => sum + (batch.positionTo ?? 0) - batch.positionFrom + 1,
      0,
    ) / Math.max(1, sized.length)
  const last = batches[batches.length - 1]
  return Math.max(average, issuedInBatch(last, issuedCount), 1)
}

const sizeOf = (batch: AdminShipmentBatch, openEnd: number) =>
  batch.positionTo === null
    ? openEnd
    : batch.positionTo - batch.positionFrom + 1

/**
 * 오픈한 회차의 배송 차수 — 바꿀 수 없어 읽기만 한다. 차수 조회에는 차수별 예약 수가
 * 없어서, 회차의 발급 순번 수를 차수 구간에 나눠 얼마나 찼는지 보여준다.
 */
export function ShipmentBatchProgress({
  batches,
  issuedCount,
  accepting,
}: ShipmentBatchProgressProps) {
  const current =
    issuedCount !== undefined && accepting
      ? currentBatchOf(batches, issuedCount)
      : undefined
  const openEnd =
    issuedCount === undefined ? 1 : openEndWeight(batches, issuedCount)

  const columns: TableColumn<AdminShipmentBatch>[] = [
    {
      key: 'batch',
      header: '차수',
      align: 'center',
      render: (batch) => `${batch.batchNumber}차`,
    },
    {
      key: 'position',
      header: '순번',
      align: 'center',
      render: (batch) =>
        batch.positionTo === null
          ? `${formatPositionRange(batch)} 끝까지`
          : formatPositionRange(batch),
    },
    {
      key: 'period',
      header: '예상 배송 기간',
      align: 'center',
      width: '40%',
      render: (batch) => formatShipPeriod(batch),
    },
    {
      key: 'issued',
      header: '발급한 순번',
      align: 'right',
      render: (batch) => {
        if (issuedCount === undefined) return '—'
        const issued = issuedInBatch(batch, issuedCount)
        const full =
          batch.positionTo !== null &&
          issued === batch.positionTo - batch.positionFrom + 1
        return (
          <span className={styles.issued}>
            {formatNumber(issued)}개
            {full && (
              <Tag size="small" color="gray" variant="subtle">
                다 참
              </Tag>
            )}
            {current?.batchNumber === batch.batchNumber && (
              <Tag size="small" color="primary" variant="subtle">
                접수 중
              </Tag>
            )}
          </span>
        )
      },
    },
  ]

  return (
    <div className={styles.root}>
      {issuedCount !== undefined && (
        <div className={styles.lane}>
          <span className={styles.laneLabel}>
            {formatNumber(issuedCount)}번까지 발급
          </span>
          <div
            className={styles.track}
            role="img"
            aria-label={batches
              .map(
                (batch) =>
                  `${batch.batchNumber}차 ${formatNumber(issuedInBatch(batch, issuedCount))}개 발급`,
              )
              .join(', ')}
          >
            {batches.map((batch) => {
              const size = sizeOf(batch, openEnd)
              const ratio = Math.min(
                1,
                issuedInBatch(batch, issuedCount) / size,
              )
              return (
                <div
                  key={batch.batchNumber}
                  className={styles.segment}
                  style={{ flexGrow: size }}
                >
                  <span
                    className={styles.fill}
                    style={{ width: `${ratio * 100}%` }}
                  />
                  <span className={styles.segmentLabel}>
                    {batch.batchNumber}차
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Table
        columns={columns}
        rows={batches}
        rowKey={(batch) => String(batch.batchNumber)}
        emptyMessage="설정된 배송 차수가 없습니다."
      />

      <span className={styles.note}>
        오픈해서 배송 구간은 바꿀 수 없어요. 발급한 순번은 취소된 예약도 세요 —
        순번은 다시 쓰지 않아요.
      </span>
    </div>
  )
}
