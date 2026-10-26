import {
  settingChangeKindLabel,
  settingChangeUnit,
  type WaitingroomSettingChange,
} from '@entities/admin-waitingroom'
import { formatShortDateTime } from '@shared/lib/formatDotDate'
import { formatNumber } from '@shared/lib/formatNumber'
import { Button, Skeleton, Tag } from '@shared/ui'

import * as styles from './SettingChangeLog.css'

export type SettingChangeLogProps = {
  /** 최신순 변경 기록. 못 받았으면 undefined — 빈 배열(기록 없음)과 구분한다 */
  changes: WaitingroomSettingChange[] | undefined
  loading: boolean
  /** 받지 못했다 */
  failed: boolean
  /** 다음 쪽이 있다 */
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  /** 상품 id → 이름. 이력엔 id만 온다 */
  nameOf: (productId: string) => string
}

const valueOf = (change: WaitingroomSettingChange, value: number | null) =>
  value === null
    ? '기본값'
    : `${formatNumber(value)}${settingChangeUnit[change.kind]}`

/**
 * 최근 변경 — 누가 언제 어떤 운영값을 얼마에서 얼마로 바꿨는지. 오픈 중에 속도가 왜 이렇게
 * 됐는지 거슬러 볼 때 쓴다. 서버는 30일까지 남기고, 끝에서 더 보기로 이어 받는다.
 */
export function SettingChangeLog({
  changes,
  loading,
  failed,
  hasMore,
  loadingMore,
  onLoadMore,
  nameOf,
}: SettingChangeLogProps) {
  return (
    <section className={styles.card} aria-labelledby="wr-changes">
      <div className={styles.head}>
        <h2 id="wr-changes" className={styles.title}>
          최근 변경
        </h2>
      </div>
      {loading ? (
        <Skeleton height={96} />
      ) : !changes ? (
        <span className={styles.status}>
          {failed ? '변경 기록을 불러오지 못했어요.' : '—'}
        </span>
      ) : changes.length === 0 ? (
        <span className={styles.status}>최근 30일 동안 바꾼 값이 없어요.</span>
      ) : (
        <ol className={styles.list}>
          {changes.map((change) => (
            <li
              key={`${change.at}-${change.kind}-${change.productId ?? ''}`}
              className={styles.item}
            >
              <span className={styles.what}>
                {change.productId
                  ? `${nameOf(change.productId)} ${settingChangeKindLabel[change.kind]}`
                  : settingChangeKindLabel[change.kind]}
                {change.confirmed && (
                  <Tag variant="subtle" size="small" color="red">
                    권장 상한 위
                  </Tag>
                )}
              </span>
              <span className={styles.values}>
                {valueOf(change, change.from)} → {valueOf(change, change.to)}
              </span>
              <span className={styles.meta}>
                {formatShortDateTime(change.at)} · {change.by}
              </span>
            </li>
          ))}
        </ol>
      )}
      {changes && hasMore && (
        <Button
          variant="outline"
          size="small"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          더 보기
        </Button>
      )}
    </section>
  )
}
