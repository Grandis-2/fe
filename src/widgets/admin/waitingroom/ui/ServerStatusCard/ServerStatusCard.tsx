import { isBraking, type WaitingroomStatus } from '@entities/admin-waitingroom'
import { Skeleton, Tag } from '@shared/ui'

import { formatSeconds } from '../../lib/duration'

import * as styles from './ServerStatusCard.css'

export type ServerStatusCardProps = {
  /** 대기열 현황. 못 받았으면 undefined */
  view: WaitingroomStatus | undefined
  loading: boolean
}

/**
 * 대기열 서버 상태 — 브레이크 · 살아 있는 서버 수 · 현황 정보가 몇 초 전 것인지. 현황이
 * 오래되면(snapshotStale) 새로 오는 사람이 모두 줄에 선다 — 안전한 기본 동작이라 확인으로
 * 알린다.
 */
export function ServerStatusCard({ view, loading }: ServerStatusCardProps) {
  const braking = isBraking(view?.brakeFactor ?? null)
  const noLeader = view !== undefined && view.leaderNodeId === null
  const noGateways = view?.gateways === 0
  const stale = view?.snapshotStale ?? false
  const ok = !braking && !noLeader && !noGateways && !stale

  return (
    <section className={styles.card} aria-labelledby="wr-server">
      <div className={styles.head}>
        <h2 id="wr-server" className={styles.title}>
          서버 상태
        </h2>
        {view && (
          <Tag variant="subtle" size="medium" color={ok ? 'green' : 'yellow'}>
            {ok ? '정상' : '확인 필요'}
          </Tag>
        )}
      </div>
      {loading ? (
        <Skeleton height={72} />
      ) : !view ? (
        <span className={styles.note}>대기열 현황을 받지 못했어요.</span>
      ) : (
        <dl className={styles.rows}>
          <div className={styles.row}>
            <dt className={styles.label}>브레이크</dt>
            <dd className={braking ? styles.valueBad : styles.value}>
              {braking ? `${view.brakeFactor}×` : '없음'}
            </dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.label}>게이트웨이</dt>
            <dd className={noGateways ? styles.valueBad : styles.value}>
              {view.gateways === null
                ? '—'
                : noGateways
                  ? '세지 못함'
                  : `${view.gateways}대`}
            </dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.label}>현황 정보</dt>
            <dd className={stale ? styles.valueBad : styles.value}>
              {view.snapshotAgeSeconds === null
                ? '—'
                : `${formatSeconds(view.snapshotAgeSeconds)} 전`}
            </dd>
          </div>
          {noLeader && (
            <div className={styles.row}>
              <dt className={styles.label}>입장 속도 계산</dt>
              <dd className={styles.valueBad}>서버 고르는 중</dd>
            </div>
          )}
        </dl>
      )}
      {stale && (
        <span className={styles.noteBad}>
          현황 정보가 오래돼 지금 새로 오는 사람은 모두 줄에 서요.
        </span>
      )}
    </section>
  )
}
