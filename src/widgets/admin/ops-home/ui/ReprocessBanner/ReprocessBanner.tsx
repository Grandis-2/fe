import { RefreshCw } from 'lucide-react'

import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './ReprocessBanner.css'

export type ReprocessBannerProps = {
  sent: number
  target: number
  remainingSeconds: number
  /** 진행 모달을 다시 연다 */
  onOpen: () => void
}

/**
 * 재처리 모달을 닫은 동안 긴급 카드 자리에 대신 뜨는 진행 띠. 빨간 긴급 띠가 남색으로 바뀌어
 * "이미 손댄 일"로 읽힌다. 끝나면 사라지고, 남은 실패가 있으면 긴급 띠로 돌아온다.
 */
export function ReprocessBanner({
  sent,
  target,
  remainingSeconds,
  onOpen,
}: ReprocessBannerProps) {
  const ratio = target > 0 ? sent / target : 1
  return (
    <section className={styles.root} aria-label="재처리 진행">
      <span className={styles.icon} aria-hidden="true">
        <RefreshCw />
      </span>
      <div className={styles.text}>
        <div className={styles.headline}>
          <span className={styles.kicker}>재처리 중</span>
          <span className={styles.title}>
            {formatNumber(sent)} / {formatNumber(target)}건
            {remainingSeconds > 0
              ? ` · 약 ${remainingSeconds}초 남음`
              : ' · 결과 확인 중'}
          </span>
        </div>
        <div className={styles.bar}>
          <span
            className={styles.barFill}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </div>
      <button type="button" className={styles.action} onClick={onOpen}>
        진행 보기
      </button>
    </section>
  )
}
