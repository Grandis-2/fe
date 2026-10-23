import { useState } from 'react'

import { Ticket } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import {
  drawEntryTag,
  formatDrawDateTime,
  useMyDrawEntries,
  type MyDrawEntry,
  type MyDrawEntryFilter,
} from '@entities/draw'
import { HistoryCard, HistoryListSkeleton } from '@entities/order'
import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'
import { startDrawEntryPayment } from '@features/payment'
import { getErrorMessage } from '@shared/api/client'
import { DRAW_PATH, drawPath, mypagePath } from '@shared/config/routes'
import { formatDotDateMinute } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { showToast } from '@shared/model/toastStore'
import { ActionButton, Button, Chip, InlineAlert, Navigator } from '@shared/ui'

import * as styles from './MypageDraw.css'

const FILTERS: { value: MyDrawEntryFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'WON', label: '당첨' },
]

const toItem = ({
  draw,
}: Pick<MyDrawEntry, 'draw'>): ProductPaymentCardItem => ({
  imageSrc: draw.gift.imageUrl ?? undefined,
  name: draw.gift.productTitle,
  modelNumber: '',
  optionSummary: draw.gift.optionTitle,
  quantityLabel: '당첨 시 1개',
  priceLabel: `응모비 ${formatWon(draw.entryFee)}`,
})

const renderItem = (product: ProductPaymentCardItem) => (
  <ProductPaymentCard product={product} />
)

// 내 응모 내역 — 탭(전체·당첨)과 쪽은 서버가 나눠 주고, 탭 옆 숫자는 탭과 상관없이 오는 counts로 그린다.
export function MypageDraw() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<MyDrawEntryFilter>('ALL')
  // 화면은 1부터, API는 0부터 센다(검색 결과와 같다).
  const [page, setPage] = useState(1)
  const { data, isPending, isPlaceholderData, error } = useMyDrawEntries(
    filter,
    page - 1,
  )
  const totalPages = data ? Math.ceil(data.total / data.size) : 0
  const [payingId, setPayingId] = useState<string | null>(null)

  // 탭을 바꾸는 동안엔 앞 탭 목록이 남아 있으니 숫자만 쓰고 목록 자리는 받는 중으로 그린다.
  const entries = isPlaceholderData ? [] : (data?.items ?? [])

  // 응모비 결제 준비 → 토스 결제창. 정상 진행되면 페이지가 결제창으로 넘어간다.
  const pay = async (drawId: string) => {
    setPayingId(drawId)
    try {
      await startDrawEntryPayment({ drawId })
    } catch (caught) {
      showToast(getErrorMessage(caught, '결제를 시작하지 못했어요.'))
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>럭키드로우</h1>
        <Link to={DRAW_PATH} className={styles.listLink}>
          진행 중인 럭키드로우 보기 ›
        </Link>
      </div>

      <div className={styles.chips}>
        {FILTERS.map(({ value, label }) => (
          <Chip
            key={value}
            selected={value === filter}
            count={value === 'WON' ? data?.counts.won : data?.counts.all}
            onClick={() => {
              setFilter(value)
              setPage(1)
            }}
          >
            {label}
          </Chip>
        ))}
      </div>

      {error ? (
        <div className={styles.empty}>
          {getErrorMessage(error, '응모 내역을 불러오지 못했어요.')}
        </div>
      ) : isPending || isPlaceholderData ? (
        <HistoryListSkeleton />
      ) : (
        entries.length === 0 && (
          <InlineAlert status="info" variant="big" icon={Ticket}>
            {filter === 'WON'
              ? '아직 당첨 내역이 없어요'
              : '아직 응모 내역이 없어요'}
          </InlineAlert>
        )
      )}

      {entries.map(({ state, ...entry }) => (
        <HistoryCard
          key={entry.entryId}
          tag={drawEntryTag[state]}
          highlight={
            state === 'AWAITING_PAYMENT'
              ? 'warning'
              : state === 'WON'
                ? 'won'
                : undefined
          }
          orderDate={formatDotDateMinute(entry.enteredAt)}
          items={[toItem(entry)]}
          renderItem={renderItem}
          footer={
            <>
              <div className={styles.row}>
                <span className={styles.rowLabel}>응모 마감</span>
                <span className={styles.rowValue}>
                  {formatDrawDateTime(entry.draw.closesAt)}
                </span>
              </div>
              {state === 'AWAITING_PAYMENT' ? (
                <ActionButton
                  size="md"
                  disabled={payingId !== null}
                  onClick={() => void pay(entry.draw.drawId)}
                >
                  응모비 결제하기
                </ActionButton>
              ) : state === 'WON' ? (
                <ActionButton
                  size="md"
                  onClick={() => navigate(mypagePath('history'))}
                >
                  주문 내역에서 확인하기
                </ActionButton>
              ) : (
                <Button
                  variant="subtle"
                  onClick={() => navigate(drawPath(entry.draw.drawId))}
                >
                  회차 보기
                </Button>
              )}
            </>
          }
        />
      ))}

      {!error && totalPages > 1 && (
        <Navigator
          className={styles.pagination}
          totalPages={totalPages}
          currentPage={page}
          onPageChange={(next) => {
            if (next === page) return
            setPage(next)
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </div>
  )
}
