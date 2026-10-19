import { formatNumber } from '@shared/lib/formatNumber'
import { Tag } from '@shared/ui'

import {
  preorderHealthLabel,
  untilClose,
  type PreorderHealth,
} from '../../lib/preorderHealth'

import * as styles from './OpenPreorderStrip.css'

// 색만으로 구분하지 않게 글자(재처리 필요·처리 밀림·정상)를 함께 단다.
const healthColor: Record<PreorderHealth, 'red' | 'yellow' | 'green'> = {
  failing: 'red',
  slow: 'yellow',
  ok: 'green',
}

export type OpenPreorder = {
  productId: string
  name: string
  /** 집계를 못 받았으면 null — 상태를 지어내지 않는다 */
  health: PreorderHealth | null
  waiting: number
  /** 외부 등록 실패(재처리 필요). 못 받았으면 null */
  failures: number | null
  closesAt: string
}

export type OpenPreorderStripProps = {
  items: readonly OpenPreorder[]
  /** 고른 사전예약 — 언제나 하나가 골라져 있다 */
  selected: string
  onSelect: (productId: string) => void
  /** 마감까지 남은 시간을 잴 기준 시각 */
  now: number
}

/**
 * 진행 중인 사전예약 띠. 사전예약마다 상태를 보이고, 누르면 홈(할 일 · 대기열 · 처리 흐름)이
 * 그 사전예약 기준으로 바뀐다. 언제나 하나가 골라져 있다 — 다른 사전예약의 문제는 띠의
 * 상태 표시로 보인다.
 */
export function OpenPreorderStrip({
  items,
  selected,
  onSelect,
  now,
}: OpenPreorderStripProps) {
  if (items.length === 0) {
    return <div className={styles.empty}>지금 접수 중인 사전예약이 없어요.</div>
  }

  return (
    <div className={styles.root} role="group" aria-label="진행 중인 사전예약">
      {items.map((item) => {
        const pressed = selected === item.productId
        return (
          <button
            key={item.productId}
            type="button"
            className={styles.card}
            aria-pressed={pressed}
            onClick={() => onSelect(item.productId)}
          >
            <span className={styles.head}>
              <span className={styles.name}>{item.name}</span>
              {item.health && (
                <Tag
                  variant="subtle"
                  size="small"
                  rounded={false}
                  color={healthColor[item.health]}
                  widthOptions={Object.values(preorderHealthLabel)}
                >
                  {preorderHealthLabel[item.health]}
                </Tag>
              )}
            </span>
            <span className={styles.meta}>
              대기 {formatNumber(item.waiting)}명 · 재처리 필요{' '}
              {item.failures === null
                ? '—'
                : `${formatNumber(item.failures)}건`}
            </span>
            <span className={styles.meta}>
              마감까지 {untilClose(item.closesAt, now)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
