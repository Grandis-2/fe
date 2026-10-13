import { useState } from 'react'

import { Ticket } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import {
  drawEntryTag,
  formatDrawDateTime,
  getDrawEntryState,
  useMyDrawEntries,
  type DrawEntry,
} from '@entities/draw'
import { HistoryCard } from '@entities/order'
import {
  ProductPaymentCard,
  type ProductPaymentCardItem,
} from '@entities/product'
import { startDrawEntryPayment } from '@features/payment'
import { getErrorMessage } from '@shared/api/client'
import { DRAW_PATH, drawPath, mypagePath } from '@shared/config/routes'
import { formatDotDate } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { showToast } from '@shared/model/toastStore'
import { ActionButton, Button, InlineAlert, SelectButton } from '@shared/ui'

import * as styles from './MypageDraw.css'

const FILTERS = ['전체', '당첨'] as const
type Filter = (typeof FILTERS)[number]

const toItem = ({ draw }: DrawEntry): ProductPaymentCardItem => ({
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

// 내 응모 내역. 명세에 "내 응모 목록" API가 없어 회차마다 내 응모를 모아 보여 준다(useMyDrawEntries).
export function MypageDraw() {
  const navigate = useNavigate()
  const { entries, isPending, error } = useMyDrawEntries()
  const [filter, setFilter] = useState<Filter>('전체')
  const [payingId, setPayingId] = useState<string | null>(null)

  const won = entries.filter((entry) => getDrawEntryState(entry) === 'won')
  const visible = filter === '당첨' ? won : entries

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
        {FILTERS.map((name) => (
          <SelectButton
            key={name}
            className={styles.chip}
            selected={name === filter}
            onClick={() => setFilter(name)}
          >
            {name}{' '}
            <span className={styles.count}>
              {name === '당첨' ? won.length : entries.length}
            </span>
          </SelectButton>
        ))}
      </div>

      {error ? (
        <div className={styles.empty}>
          {getErrorMessage(error, '응모 내역을 불러오지 못했어요.')}
        </div>
      ) : isPending ? (
        <div className={styles.empty}>응모 내역을 불러오는 중이에요.</div>
      ) : (
        visible.length === 0 && (
          <InlineAlert status="info" variant="big" icon={Ticket}>
            {filter === '당첨'
              ? '아직 당첨 내역이 없어요'
              : '아직 응모 내역이 없어요'}
          </InlineAlert>
        )
      )}

      {visible.map((entry) => {
        const state = getDrawEntryState(entry)
        if (state === 'none') return null
        return (
          <HistoryCard
            key={entry.entryId}
            tag={drawEntryTag[state]}
            highlight={state === 'unpaid'}
            orderDate={formatDotDate(entry.createdAt)}
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
                {state === 'unpaid' ? (
                  <ActionButton
                    size="md"
                    disabled={payingId !== null}
                    onClick={() => void pay(entry.drawId)}
                  >
                    응모비 결제하기
                  </ActionButton>
                ) : state === 'won' ? (
                  <ActionButton
                    size="md"
                    onClick={() => navigate(mypagePath('history'))}
                  >
                    주문 내역에서 확인하기
                  </ActionButton>
                ) : (
                  <Button
                    variant="subtle"
                    onClick={() => navigate(drawPath(entry.drawId))}
                  >
                    회차 보기
                  </Button>
                )}
              </>
            }
          />
        )
      })}
    </div>
  )
}
