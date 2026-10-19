import { useReservationStatsByProduct } from '@entities/admin-reservation'
import {
  waitEstimate,
  WAITINGROOM_DEFAULTS,
  type WaitingroomProductRate,
  type WaitingroomProductStatus,
} from '@entities/admin-waitingroom'
import { SLOW_AFTER_MS } from '@features/open-preorder-picker'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import { formatNumber } from '@shared/lib/formatNumber'
import { closeModal, openModal } from '@shared/model/modalStore'
import { Button, Table, Tag } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { formatSeconds, oldestSeconds } from '../../lib/duration'
import { BacklogTrend } from '../BacklogTrend'
import { NumberSettingForm } from '../NumberSettingForm'

import * as styles from './ProductCapTable.css'

import type { AdmissionChange } from '../../lib/useAdmissionChange'

export type ProductCapTableProps = {
  /** 대기가 많은 순으로 정렬된 상품별 대기열 */
  products: readonly WaitingroomProductStatus[]
  /** 상품별 상한 운영값. 못 받았으면 undefined */
  rates: readonly WaitingroomProductRate[] | undefined
  /** 상한으로 정할 수 있는 최댓값 */
  maxCredit: number
  nameOf: (productId: string) => string
  refreshInterval: RefreshInterval
  loading: boolean
  /** 비어 있을 때 문구 — 조회 실패와 0건을 구분해 부모가 정한다 */
  emptyMessage: string
  admission: AdmissionChange
}

/**
 * 상품별 상한 표 — 어느 상품에서 밀리는지(외부 등록 대기·가장 오래 기다린 등록) 보고 그
 * 상품의 상한만 낮춘다. 실제 입장이 상한에 닿은 상품엔 표시를 붙인다 — 전역 속도를 올려도
 * 그 상품 몫은 늘지 않는다.
 */
export function ProductCapTable({
  products,
  rates,
  maxCredit,
  nameOf,
  refreshInterval,
  loading,
  emptyMessage,
  admission,
}: ProductCapTableProps) {
  const productStats = useReservationStatsByProduct(
    products.map((product) => product.productId),
    refreshInterval,
  )
  const statsOf = (productId: string) =>
    productStats[products.findIndex((item) => item.productId === productId)]
  const capOf = (productId: string) =>
    rates?.find((item) => item.productId === productId)?.cap

  const askCap = (product: WaitingroomProductStatus) => {
    const name = nameOf(product.productId)
    openModal({
      theme: 'light',
      title: `${name}의 입장 상한을 바꿀까요?`,
      description: '바꾸면 1초 안에 실제 회원의 입장에 반영됩니다.',
      children: (
        <NumberSettingForm
          label="상품 입장 상한"
          unit="명/초"
          min={1}
          max={maxCredit}
          initial={capOf(product.productId)?.value ?? product.cap}
          hint="낮춰도 이미 줄에 선 사람은 빠지지 않습니다."
          onCancel={closeModal}
          onConfirm={(value) => {
            closeModal()
            admission.apply(
              { kind: 'productCap', productId: product.productId, value },
              `${name}의 입장 상한을 바꿨습니다.`,
            )
          }}
        />
      ),
    })
  }

  const resetCap = (product: WaitingroomProductStatus) => {
    const name = nameOf(product.productId)
    admission.confirm(
      `${name}의 입장 상한을 기본값으로 되돌릴까요?`,
      `${WAITINGROOM_DEFAULTS.productCap}명/초로 돌아가고 1초 안에 반영됩니다.`,
      '되돌리기',
      () =>
        admission.apply(
          { kind: 'productCap', productId: product.productId, value: null },
          `${name}의 입장 상한을 기본값으로 되돌렸습니다.`,
        ),
    )
  }

  const columns: TableColumn<WaitingroomProductStatus>[] = [
    {
      key: 'name',
      header: '상품',
      render: (product) => nameOf(product.productId),
    },
    {
      key: 'waiting',
      header: '대기',
      align: 'right',
      render: (product) => `${formatNumber(product.waiting)}명`,
    },
    {
      key: 'wait',
      header: '맨 뒤 대기',
      align: 'right',
      render: (product) => waitEstimate(product.waiting, product.credit) ?? '—',
    },
    {
      key: 'credit',
      header: '실제 입장 / 상한',
      render: (product) => {
        const atCap = product.cap > 0 && product.credit >= product.cap
        return (
          <span className={styles.capCell}>
            <span
              className={styles.miniTrack}
              role="img"
              aria-label={`실제 ${product.credit}, 상한 ${product.cap}`}
            >
              <span
                className={styles.miniFill[atCap ? 'atCap' : 'normal']}
                style={{
                  width: `${Math.min(100, (product.credit / Math.max(product.cap, 1)) * 100)}%`,
                }}
              />
            </span>
            {product.credit} / {product.cap}
            {atCap && (
              <Tag variant="subtle" size="small" rounded={false} color="yellow">
                상한에 닿음
              </Tag>
            )}
          </span>
        )
      },
    },
    {
      key: 'backlog',
      header: '외부 등록 대기',
      align: 'right',
      render: (product) => <BacklogTrend productId={product.productId} />,
    },
    {
      key: 'oldest',
      header: '가장 오래 기다린 등록',
      align: 'right',
      render: (product) => {
        const query = statsOf(product.productId)
        const seconds = oldestSeconds(
          query?.data?.oldestPendingSyncAt,
          query?.dataUpdatedAt ?? 0,
        )
        if (seconds === null) return '—'
        return (
          <span
            className={
              seconds * 1000 > SLOW_AFTER_MS ? styles.slowText : undefined
            }
          >
            {formatSeconds(seconds)}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (product) => (
        <div className={styles.rowActions}>
          {capOf(product.productId)?.source === 'OPERATIONAL' && (
            <Button
              size="small"
              variant="subtle"
              disabled={admission.isPending}
              onClick={() => resetCap(product)}
            >
              기본값
            </Button>
          )}
          <Button
            size="small"
            variant="outline"
            color="primary"
            disabled={admission.isPending || !rates}
            onClick={() => askCap(product)}
          >
            상한 바꾸기
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      rows={[...products]}
      rowKey={(product) => product.productId}
      loading={loading}
      emptyMessage={emptyMessage}
    />
  )
}
