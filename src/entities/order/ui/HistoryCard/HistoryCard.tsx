import { useState, type ReactNode } from 'react'

import { ChevronDown } from 'lucide-react'

import { useCountdown } from '@shared/lib/useCountdown'
import { Tag, type TagProps } from '@shared/ui'

import { orderStatusLabel, type OrderStatus } from '../../model/orderStatus'

import * as styles from './HistoryCard.css'

// 상품이 많으면 다음 주문이 한참 아래로 밀리므로 처음엔 이만큼만 보여 준다.
const COLLAPSED_COUNT = 2

const tagColor: Record<OrderStatus, TagProps['color']> = {
  confirm: 'yellow',
  ready: 'primary',
  preship: 'primary',
  shipping: 'blue',
  delivered: 'gray',
  cancelled: 'gray',
}

// HistoryCard는 아이템을 renderItem으로 넘기기만 하고 필드는 읽지 않는다 —
// 아이템 모양을 여기서 따로 선언하지 않고 제네릭 T로 호출부 타입을 그대로 받는다.
export type HistoryCardProps<T> = {
  status: OrderStatus
  /** 상태 태그 대신 보일 태그(내 리뷰의 '리뷰 작성 가능' 등) */
  badge?: { label: string; color: TagProps['color'] }
  /** 사전예약 주문이면 상태 옆에 '사전예약' 태그가 붙는다. */
  preorder?: boolean
  orderDate: string
  orderNumber: string
  numberLabel?: string
  /** 구매 확정 마감 — 있으면 머리 아래에 남은 시간 띠가 붙는다. 렌더마다 새 Date를 넘기지 않는다. */
  purchaseDueAt?: Date
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  /** 상품 목록 아래 본문(예약 정보 등) */
  children?: ReactNode
  /** 한 단계 어두운 바닥 칸 — 결제 금액, 취소·확정 버튼 */
  footer?: ReactNode
  className?: string
}

export function HistoryCard<T>({
  status,
  badge,
  preorder,
  orderDate,
  orderNumber,
  numberLabel = '주문번호',
  purchaseDueAt,
  items,
  renderItem,
  children,
  footer,
  className,
}: HistoryCardProps<T>) {
  const [expanded, setExpanded] = useState(false)
  const hiddenCount = items.length - COLLAPSED_COUNT
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_COUNT)

  return (
    <article
      className={[
        styles.root,
        status === 'confirm' && styles.rootWarning,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.header}>
        <span className={styles.orderDate}>{orderDate}</span>
        <Tag
          color={badge?.color ?? tagColor[status]}
          variant="subtle"
          rounded={false}
          className={styles.tag}
        >
          {badge?.label ?? orderStatusLabel[status]}
        </Tag>
        {preorder && (
          <Tag
            color="secondary"
            variant="subtle"
            rounded={false}
            className={styles.tag}
          >
            사전예약
          </Tag>
        )}
        <span className={styles.orderNumber}>
          {numberLabel} {orderNumber}
        </span>
      </header>

      {purchaseDueAt && <PurchaseDueNotice dueAt={purchaseDueAt} />}

      <div className={styles.items}>
        {visibleItems.map((item, index) => (
          <div
            key={index}
            className={[
              styles.item,
              index >= COLLAPSED_COUNT && styles.itemEnter,
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              index >= COLLAPSED_COUNT
                ? { animationDelay: `${(index - COLLAPSED_COUNT) * 50}ms` }
                : undefined
            }
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.expandRow}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? '접기' : `상품 ${hiddenCount}개 더보기`}
          <ChevronDown
            aria-hidden="true"
            className={[styles.expandIcon, expanded && styles.expandIconOpen]
              .filter(Boolean)
              .join(' ')}
          />
        </button>
      )}

      {children}

      {footer && <footer className={styles.footer}>{footer}</footer>}
    </article>
  )
}

const pad = (value: number) => String(value).padStart(2, '0')

// 카운트다운은 1초마다 다시 그려진다 — 카드 전체가 아니라 이 띠만 다시 그리도록 따로 둔다.
function PurchaseDueNotice({ dueAt }: { dueAt: Date }) {
  const { days, hours, minutes, seconds, isOver } = useCountdown(dueAt)

  return (
    <div className={styles.notice}>
      <div className={styles.noticeTexts}>
        <span className={styles.noticeTitle}>
          {isOver ? '구매 확정 기한이 지났어요' : '구매 확정 마감까지'}
        </span>
        <span className={styles.noticeDescription}>
          기한 안에 확정하지 않으면 예약이 자동 취소돼요.
        </span>
      </div>
      {/* 마감이 정확히 24시간이면 훅이 days=1, hours=0으로 쪼개므로 시간 단위로 합친다. */}
      {!isOver && (
        <span className={styles.countdown}>
          {pad(days * 24 + hours)}:{minutes}:{seconds}
        </span>
      )}
    </div>
  )
}
