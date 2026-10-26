import { useState } from 'react'

import {
  getAdminProductStocks,
  sortStocksByUrgency,
  stockLevelLabel,
  stockLevelOf,
  sumStocks,
  useAdminProduct,
  useAdminProductStock,
  useCorrectStockOption,
  usePreviewStockCorrection,
  useStockDrifts,
  type AdminProductStock,
  type AdminStockDrift,
  type StockLevel,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { formatShortDateTime } from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { useNow } from '@shared/lib/useNow'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  InlineAlert,
  NoticeBanner,
  ReasonForm,
  SegmentedTabs,
  StatCard,
  Table,
  Tag,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminProductStockTable.css'

export type AdminProductStockTableProps = {
  productId: string
}

type Filter = 'all' | Exclude<StockLevel, 'ok'>

const filters: Filter[] = ['all', 'out', 'low', 'unregistered']

const levelTag: Record<
  Exclude<StockLevel, 'ok'>,
  { color: 'red' | 'yellow' | 'gray'; variant: 'subtle' | 'outline' }
> = {
  out: { color: 'red', variant: 'subtle' },
  low: { color: 'yellow', variant: 'subtle' },
  unregistered: { color: 'gray', variant: 'outline' },
}

const REASON_MAX = 500

// 대조는 매일 새벽에 도니, 마지막 대조가 하루를 넘겼으면 멈춘 것이다(명세).
const RECONCILE_STALE_MS = 24 * 60 * 60 * 1000

/** 대조 시각을 날짜로 말한다 — 오늘이면 "오늘 HH:mm", 아니면 "MM.DD HH:mm" */
const reconcileWhen = (finishedAt: string, now: number) =>
  new Date(finishedAt).toDateString() === new Date(now).toDateString()
    ? `오늘 ${formatShortDateTime(finishedAt).slice(6)}`
    : formatShortDateTime(finishedAt)

const optionName = (row: AdminProductStock) =>
  [row.color, ...row.optionNames].filter((name) => name !== '-').join(' · ')

/**
 * 일반 상품의 옵션별 재고. 위에 합계를, 표는 손볼 것(미등록·품절·임박)부터 보여준다.
 * 새벽 장부 대조에서 주문과 어긋난 옵션이 있으면 맨 위에 알리고 그 자리에서 보정한다.
 * 수량(총량) 자체는 수정 탭에서 바꾼다.
 */
export function AdminProductStockTable({
  productId,
}: AdminProductStockTableProps) {
  const product = useAdminProduct(productId)
  const stock = useAdminProductStock(productId)
  const drifts = useStockDrifts(productId)
  const now = useNow(60_000).getTime()
  const runAt = drifts.data?.finishedAt ?? null
  const runStale =
    runAt !== null && now - Date.parse(runAt) > RECONCILE_STALE_MS
  const correct = useCorrectStockOption(productId)
  const preview = usePreviewStockCorrection(productId)
  const [filter, setFilter] = useState<Filter>('all')

  const failed = product.error ?? stock.error
  const loading = !failed && (product.isPending || stock.isPending)
  const rows =
    product.data && stock.data
      ? sortStocksByUrgency(getAdminProductStocks(product.data, stock.data))
      : []
  const totals = sumStocks(rows)
  const countOf = (target: Filter) =>
    target === 'all'
      ? rows.length
      : rows.filter((row) => stockLevelOf(row) === target).length
  const visibleRows =
    filter === 'all' ? rows : rows.filter((row) => stockLevelOf(row) === filter)
  const driftIds = new Set(
    (drifts.data?.options ?? []).map((item) => item.optionId),
  )

  // 새벽 대조 뒤 주문이 들어왔을 수 있어, 확인 창을 열기 전에 지금 숫자를 다시 받는다.
  const confirmCorrect = (drift: AdminStockDrift, row?: AdminProductStock) => {
    correct.reset()
    preview.mutate(drift.optionId, {
      onSuccess: (now) => {
        const name = row ? optionName(row) : '이 옵션'
        if (now.matches) {
          showToast(`${name}은(는) 이미 주문 기준과 같아요.`)
          void drifts.refetch()
          return
        }
        // 보정하면 409(STOCK_TOTAL_BELOW_EXPECTED) — 보내기 전에 막고 할 일을 알린다.
        const expected = now.expectedReserved + now.expectedSold
        if (expected > now.stockTotal) {
          openModal({
            theme: 'light',
            title: '전체 수량을 먼저 늘려 주세요',
            description: `${name}의 주문 기준 수량(결제 대기 + 판매 완료) ${formatNumber(expected)}개가 전체 수량 ${formatNumber(now.stockTotal)}개보다 많아 보정할 수 없어요. 재고 수정에서 전체 수량을 ${formatNumber(expected)}개 이상으로 늘린 뒤 보정해 주세요.`,
            confirmLabel: '확인',
            onConfirm: closeModal,
          })
          return
        }
        openCorrect(drift, name, now)
      },
    })
  }

  const openCorrect = (
    drift: AdminStockDrift,
    name: string,
    now: Pick<
      AdminStockDrift,
      'stockReserved' | 'stockSold' | 'expectedReserved' | 'expectedSold'
    >,
  ) => {
    openModal({
      theme: 'light',
      title: '주문 기준으로 보정할까요?',
      description: `${name}의 결제 대기 ${formatNumber(now.stockReserved)} → ${formatNumber(now.expectedReserved)}, 판매 완료 ${formatNumber(now.stockSold)} → ${formatNumber(now.expectedSold)}로 바뀝니다(지금 기준).
전체 수량은 그대로이고, 사유는 보정 기록에 남습니다.`,
      children: (
        <ReasonForm
          label="보정 사유"
          placeholder="예: 결제 취소가 장부에 늦게 반영돼 맞춥니다."
          maxLength={REASON_MAX}
          confirmLabel="보정하기"
          onConfirm={(reason) => {
            closeModal()
            correct.mutate(
              { optionId: drift.optionId, reason },
              {
                onSuccess: ({ changed }) =>
                  showToast(
                    changed
                      ? '장부를 주문 기준으로 맞췄습니다.'
                      : '이미 주문 기준과 같아 바꾸지 않았습니다.',
                  ),
              },
            )
          }}
          onCancel={closeModal}
        />
      ),
    })
  }

  const columns: TableColumn<AdminProductStock>[] = [
    {
      key: 'option',
      header: '옵션',
      render: (row) => {
        const level = stockLevelOf(row)
        return (
          <span className={styles.option}>
            <span
              className={styles.swatch}
              style={row.colorHex ? { background: row.colorHex } : undefined}
              aria-hidden="true"
            />
            {optionName(row)}
            {level !== 'ok' && (
              <Tag size="small" {...levelTag[level]}>
                {stockLevelLabel[level]}
              </Tag>
            )}
            {driftIds.has(row.optionId) && (
              <Tag size="small" color="yellow" variant="outline">
                장부 확인
              </Tag>
            )}
          </span>
        )
      },
    },
    {
      key: 'price',
      header: '판매가',
      align: 'right',
      render: (row) => formatWon(row.price),
    },
    {
      key: 'available',
      header: '남은 수량',
      align: 'right',
      width: '220px',
      render: (row) =>
        row.registered ? (
          <span className={styles.stock}>
            {formatNumber(row.available)}
            <span className={styles.bar} aria-hidden="true">
              <span
                className={styles.barFill[stockLevelOf(row)]}
                style={{
                  width: `${row.total > 0 ? (row.available / row.total) * 100 : 0}%`,
                }}
              />
            </span>
          </span>
        ) : (
          '—'
        ),
    },
    {
      // 결제 대기는 주문은 했고 결제 전이라 잡아 둔 수량이다(장바구니에 담기만 해선 안
      // 잡힌다) — 아직 팔린 게 아니라 판매 완료와 따로 센다.
      key: 'reserved',
      header: '결제 대기',
      align: 'right',
      render: (row) => (row.registered ? formatNumber(row.reserved) : '—'),
    },
    {
      key: 'sold',
      header: '판매 완료',
      align: 'right',
      render: (row) => (row.registered ? formatNumber(row.sold) : '—'),
    },
    {
      key: 'total',
      header: '전체',
      align: 'right',
      render: (row) => (row.registered ? formatNumber(row.total) : '—'),
    },
  ]

  const firstDrift = drifts.data?.options[0]
  const firstDriftRow = rows.find(
    (row) => row.optionId === firstDrift?.optionId,
  )

  return (
    <div className={styles.root}>
      {/* 다시 불러오기에 실패해도 이전 데이터는 남아 표에 그대로 보인다 — 그 사실을 따로 알린다. */}
      {failed != null && rows.length > 0 && (
        <InlineAlert status="warning">
          {getErrorMessage(failed, '재고를 다시 불러오지 못했습니다.')} 이전에
          불러온 재고를 표시하고 있습니다.
        </InlineAlert>
      )}

      <div className={styles.tiles}>
        <StatCard
          label="전체 수량"
          loading={loading}
          muted={!stock.data}
          value={stock.data ? formatNumber(totals.total) : '—'}
          caption="입고된 모든 수량"
        />
        <StatCard
          label="남은 수량"
          loading={loading}
          muted={!stock.data}
          value={stock.data ? formatNumber(totals.available) : '—'}
          caption="지금 팔 수 있어요"
        />
        <StatCard
          label="결제 대기"
          loading={loading}
          muted={!stock.data}
          value={stock.data ? formatNumber(totals.reserved) : '—'}
          caption="주문했고 결제 전 · 기한이 지나면 돌아와요"
        />
        <StatCard
          label="판매 완료"
          loading={loading}
          muted={!stock.data}
          value={stock.data ? formatNumber(totals.sold) : '—'}
          caption="결제까지 끝남"
        />
      </div>

      {runStale && (
        <InlineAlert status="warning">
          마지막 장부 대조가 하루 넘게 지났어요. 대조가 멈췄을 수 있어요. 아래는
          그때 결과예요.
        </InlineAlert>
      )}
      {firstDrift && (
        <NoticeBanner
          tone="warning"
          title={`${runAt ? reconcileWhen(runAt, now) : '마지막'} 장부 대조에서 주문과 다른 옵션 ${drifts.data?.options.length}개`}
          description={`${firstDriftRow ? optionName(firstDriftRow) : '옵션'} — 결제 대기 장부 ${formatNumber(firstDrift.stockReserved)} / 주문 기준 ${formatNumber(firstDrift.expectedReserved)}. 보정하면 결제 대기·판매 완료만 주문 기준으로 바뀌고 전체 수량은 그대로예요.`}
          action={
            <Button
              size="small"
              variant="outline"
              disabled={correct.isPending || preview.isPending}
              onClick={() => confirmCorrect(firstDrift, firstDriftRow)}
            >
              {correct.isPending ? '보정 중…' : '사유 쓰고 보정하기'}
            </Button>
          }
        />
      )}
      {preview.isError && (
        <InlineAlert status="error">
          {getErrorMessage(preview.error, '지금 장부를 확인하지 못했습니다.')}
        </InlineAlert>
      )}
      {correct.isError && (
        <InlineAlert status="error">
          {getErrorMessage(correct.error, '장부를 보정하지 못했습니다.')}
        </InlineAlert>
      )}
      {drifts.isError && (
        <InlineAlert status="warning">
          {getErrorMessage(
            drifts.error,
            '장부 대조 결과를 불러오지 못했습니다.',
          )}
        </InlineAlert>
      )}
      {drifts.data?.truncated && (
        <InlineAlert status="warning">
          어긋난 옵션이 1000개를 넘어 앞의 1000개만 확인했어요. 이 상품에 어긋난
          옵션이 없어도 빠졌을 수 있어요.
        </InlineAlert>
      )}

      <div className={styles.filterBar}>
        <SegmentedTabs
          items={filters.map((value) => ({
            value,
            label: (
              <span className={styles.filterLabel}>
                {value === 'all' ? '전체' : stockLevelLabel[value]}
                <span className={styles.filterCount}>{countOf(value)}</span>
              </span>
            ),
          }))}
          value={filter}
          onChange={setFilter}
        />
        <span className={styles.note}>
          손볼 것부터 · 임박 = 전체의 10% 이하 · 수량은 수정 탭에서 바꿔요(결제
          대기 + 판매 완료보다 적게는 못 줄여요)
        </span>
      </div>

      <Table
        columns={columns}
        rows={visibleRows}
        rowKey={(row) => row.optionId}
        pageSize={10}
        // 조회 실패를 '재고 없음'으로 보이면 운영 판단이 정반대가 된다.
        loading={loading}
        emptyMessage={
          failed
            ? getErrorMessage(failed, '재고를 불러오지 못했습니다.')
            : filter === 'all'
              ? '등록된 옵션이 없습니다.'
              : `${stockLevelLabel[filter]}인 옵션이 없습니다.`
        }
      />
      <span className={styles.note}>
        남은 수량 = 전체 − 결제 대기 − 판매 완료. 결제 기한이 지나 취소되면 결제
        대기만큼 다시 늘어요. 재고 미등록 옵션은 구매 화면에서 품절로 보여요 —
        수정 탭에서 수량을 넣어 주세요.
      </span>
    </div>
  )
}
