import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './RunDiffSummary.css'

export type RunDiffSummaryProps = {
  /** 신규·잔여·해소 건수. 못 받았으면 undefined */
  counts:
    { introduced: number; persisting: number; resolved: number } | undefined
  failed: boolean
}

/**
 * 직전 검사와 비교 — 새로 생긴 불일치가 몇 건인지가 먼저다. 그대로 남은 건 오래 끈 것이고,
 * 해소는 이번에 안 나왔다는 뜻일 뿐이라(조치로 고쳐졌는지는 예약 이력에서 본다) 뒤에 둔다.
 */
export function RunDiffSummary({ counts, failed }: RunDiffSummaryProps) {
  if (!counts)
    return failed ? (
      <div className={styles.root}>직전 검사와 비교하지 못했어요.</div>
    ) : null
  return (
    <div className={styles.root} aria-label="직전 검사와 비교">
      <span className={styles.label}>직전 검사와 비교</span>
      <span className={counts.introduced > 0 ? styles.alert : undefined}>
        신규 {formatNumber(counts.introduced)}건
      </span>
      <span>그대로 {formatNumber(counts.persisting)}건</span>
      <span>해소 {formatNumber(counts.resolved)}건</span>
    </div>
  )
}
