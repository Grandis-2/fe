import {
  currentBatchOf,
  displayStatusLabel,
  getAdminProductStocks,
  isPreorder,
  stockLevelOf,
  sumStocks,
  useAdminPreorderCampaign,
  useAdminProductStock,
  useAdminShipmentBatches,
  type AdminDisplayStatus,
  type AdminProductDetailModel,
  type AdminShipmentBatch,
} from '@entities/admin-product'
import { formatDistance } from '@shared/lib/formatDistance'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { useNow } from '@shared/lib/useNow'
import { StatCard } from '@shared/ui'

import * as styles from './AdminProductSummary.css'

export type AdminProductSummaryProps = {
  product: Pick<
    AdminProductDetailModel,
    | 'productId'
    | 'saleMode'
    | 'campaign'
    | 'variants'
    | 'optionAxes'
    | 'discountRate'
    | 'displayStatus'
  >
}

const periodFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** '10월 25일 10:00 ~ 10월 28일 23:59', 하루 안이면 '10월 25일 10:00 ~ 23:59' */
const formatPeriod = (opensAt: string, closesAt: string) => {
  const open = new Date(opensAt)
  const close = new Date(closesAt)
  return `${periodFormat.format(open)} ~ ${(sameDay(open, close) ? timeFormat : periodFormat).format(close)}`
}

// 남은 시간은 분 단위로만 보여 1분마다 다시 그리면 충분하다.
const NOW_INTERVAL_MS = 60_000

/**
 * 상품 상세 머리의 요약 네 칸 — 어느 탭에 있든 지금 상태를 한눈에 본다. 앞의 두 칸(판매가·
 * 옵션)은 상세로 정하고, 뒤의 두 칸은 판매 방식에 따라 다르다. 사전예약은 접수 기간과
 * 배송 차수를, 일반 상품은 남은 수량과 재고 경고를 보여준다.
 */
export function AdminProductSummary({ product }: AdminProductSummaryProps) {
  const preorder = isPreorder(product)
  const now = useNow(NOW_INTERVAL_MS).getTime()
  const batches = useAdminShipmentBatches(product.productId, {
    enabled: preorder && !!product.campaign,
  })
  const campaign = useAdminPreorderCampaign(product.productId, {
    enabled: preorder && product.campaign?.status === 'OPEN',
  })

  const selling = product.variants.filter(
    (variant) => variant.status === 'ACTIVE',
  )
  const cheapest = selling.reduce<(typeof selling)[number] | undefined>(
    (min, variant) => (!min || variant.price < min.price ? variant : min),
    undefined,
  )
  const paused = product.variants.length - selling.length

  return (
    <div className={styles.root} aria-label="상품 요약">
      <StatCard
        label="판매가"
        value={cheapest ? `${formatWon(cheapest.price)}~` : '—'}
        muted={!cheapest}
        caption={
          cheapest
            ? product.discountRate > 0
              ? `정가 ${formatWon(cheapest.listPrice)} · ${product.discountRate}% 할인`
              : '할인 없음'
            : '판매 중인 옵션이 없어요'
        }
      />
      <StatCard
        label="옵션"
        value={`${product.variants.length}종`}
        caption={`판매 중지 ${paused}종`}
      />
      {preorder ? (
        <>
          <StatCard
            label="접수 기간"
            value={
              product.campaign
                ? formatPeriod(
                    product.campaign.opensAt,
                    product.campaign.closesAt,
                  )
                : '—'
            }
            muted={!product.campaign}
            caption={campaignCaption(product.campaign, now)}
          />
          <StatCard
            label="배송 구간"
            loading={batches.isPending && batches.fetchStatus !== 'idle'}
            value={
              batches.data
                ? `${batches.data.length}차`
                : batches.isError
                  ? '조회 실패'
                  : '—'
            }
            muted={!batches.data}
            caption={
              product.campaign?.status === 'BEFORE_OPEN'
                ? '오픈 전이라 바꿀 수 있어요'
                : batches.data && campaign.data
                  ? currentBatchCaption(batches.data, campaign.data.issuedCount)
                  : '오픈해서 바꿀 수 없어요'
            }
          />
        </>
      ) : (
        <>
          <StockSummary product={product} />
          <StatCard
            label="전시"
            value={displayStatusLabel[product.displayStatus]}
            caption={displayCaption[product.displayStatus]}
          />
        </>
      )}
    </div>
  )
}

const displayCaption: Record<AdminDisplayStatus, string> = {
  DRAFT: '판매 준비가 끝나면 고른 대로 바뀌어요',
  PUBLISHED: '구매자 목록에 보여요',
  SCHEDULED: '오픈하면 보여요',
  ENDED: '접수가 끝나 보이지 않아요',
  HIDDEN: '구매자에게 보이지 않아요',
}

function campaignCaption(
  campaign: AdminProductSummaryProps['product']['campaign'],
  now: number,
) {
  if (!campaign) return '회차가 아직 없어요'
  // 단계는 서버 시각 기준이라 화면 시각과 몇 초 어긋날 수 있다 — 지난 시각을 '남았다'고
  // 하지 않는다.
  if (campaign.status === 'BEFORE_OPEN') {
    const left = Date.parse(campaign.opensAt) - now
    return left > 0 ? `오픈까지 ${formatDistance(left)}` : '곧 오픈해요'
  }
  if (campaign.status === 'OPEN') {
    const left = Date.parse(campaign.closesAt) - now
    return left > 0 ? `마감까지 ${formatDistance(left)}` : '곧 마감돼요'
  }
  return '접수 마감'
}

function currentBatchCaption(
  batches: AdminShipmentBatch[],
  issuedCount: number,
) {
  const current = currentBatchOf(batches, issuedCount)
  return current
    ? `지금 접수는 ${current.batchNumber}차 구간(${formatNumber(current.positionFrom)}번~)`
    : '오픈해서 바꿀 수 없어요'
}

/** 일반 상품의 남은 수량 — 품절·임박·미등록이 있으면 같이 센다 */
function StockSummary({ product }: AdminProductSummaryProps) {
  // 사전예약은 재고를 세지 않아 일반 상품일 때만 부른다.
  const stock = useAdminProductStock(product.productId)
  const rows = stock.data ? getAdminProductStocks(product, stock.data) : []
  const levels = rows.map(stockLevelOf)
  const count = (level: ReturnType<typeof stockLevelOf>) =>
    levels.filter((item) => item === level).length
  const warnings = [
    ['품절', count('out')],
    ['임박', count('low')],
    ['재고 미등록', count('unregistered')],
  ].filter(([, n]) => Number(n) > 0)

  return (
    <StatCard
      label="남은 수량"
      loading={stock.isPending}
      value={
        stock.data
          ? `${formatNumber(sumStocks(rows).available)}대`
          : '조회 실패'
      }
      muted={!stock.data}
      caption={
        warnings.length > 0
          ? warnings.map(([label, n]) => `${label} ${n}`).join(' · ')
          : stock.data && '모든 옵션이 넉넉해요'
      }
    />
  )
}
