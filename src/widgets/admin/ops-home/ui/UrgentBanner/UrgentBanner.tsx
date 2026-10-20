import { TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'

import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './UrgentBanner.css'

/** 결제를 막는 일 하나 — '외부 등록 실패 860건' */
export type UrgentItem = {
  key: string
  label: string
  count: number
  /** 어느 사전예약에서 났는지 — '아이폰 18 Pro 812'. 하나만 열려 있거나 골랐으면 비운다 */
  breakdown?: readonly string[]
  action: { label: string; to: string }
}

export type UrgentBannerProps = {
  items: readonly UrgentItem[]
  /** 스크롤해서 위에 붙어 있다 — 아래 내용을 덜 가리게 얇은 한 줄로 줄인다 */
  compact?: boolean
}

const Icon = ({ className }: { className: string }) => (
  <span className={className} aria-hidden="true">
    <TriangleAlert />
  </span>
)

/**
 * 운영 대시보드 맨 위의 긴급 카드. 결제를 막는 일이라 스크롤해도 위에 붙어 따라온다.
 * - 한 건: 경고 띠 — '긴급 · 결제 막힘', 크게 건수, 사전예약별 칩, 처리 버튼
 * - 여러 건: 머리에 건수, 줄마다 처리 버튼
 * - 위에 붙어 있을 때(compact): 빨간 한 줄 — 아이콘·첫 건·버튼만
 */
export function UrgentBanner({ items, compact = false }: UrgentBannerProps) {
  const [first] = items
  if (!first) return null

  if (compact) {
    return (
      <section className={styles.compact} aria-label="긴급 할 일">
        <Icon className={styles.compactIcon} />
        <span className={styles.compactTitle}>
          {items.length > 1
            ? `긴급 ${items.length}건 · 결제가 막혀 있어요`
            : `결제 막힘 · ${first.label} ${formatNumber(first.count)}건`}
        </span>
        <Link to={first.action.to} className={styles.compactAction}>
          {first.action.label}
        </Link>
      </section>
    )
  }

  if (items.length > 1) {
    return (
      <section className={styles.list} aria-label="긴급 할 일">
        <div className={styles.listHead}>
          <Icon className={styles.listIcon} />
          긴급 {items.length}건 — 결제가 막혀 있어요
        </div>
        {items.map((item) => (
          <div key={item.key} className={styles.listRow}>
            <span className={styles.listTitle}>
              {item.label} {formatNumber(item.count)}건
            </span>
            <Link to={item.action.to} className={styles.action}>
              {item.action.label}
            </Link>
          </div>
        ))}
      </section>
    )
  }

  return (
    <section className={styles.banner} aria-label="긴급 할 일">
      <Icon className={styles.icon} />
      <div className={styles.text}>
        <div className={styles.headline}>
          <span className={styles.kicker}>긴급 · 결제 막힘</span>
          <span className={styles.title}>
            {first.label}{' '}
            <span className={styles.count}>{formatNumber(first.count)}건</span>
          </span>
        </div>
        {first.breakdown && first.breakdown.length > 0 && (
          <ul className={styles.chips} aria-label="사전예약별">
            {first.breakdown.map((chip) => (
              <li key={chip} className={styles.chip}>
                {chip}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link to={first.action.to} className={styles.action}>
        {first.action.label}
      </Link>
    </section>
  )
}
