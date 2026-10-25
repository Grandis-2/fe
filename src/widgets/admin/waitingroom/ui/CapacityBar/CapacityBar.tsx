import type { AdmissionCapacity } from '@entities/admin-waitingroom'
import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './CapacityBar.css'

export type CapacityBarProps = {
  /** 권장 상한이 있는 용량만 넘긴다 — 모르면 막대를 그리지 않는다 */
  capacity: AdmissionCapacity & { recommendedMax: number }
  /** 지금 전체 상한 설정(운영값) */
  setting: number | null
  /** 입력 중인 바꿀 값 */
  draft: number | null
  /** 실제 적용 중인 값 — 설정과 다를 때만 표시한다 */
  applied: number | null
}

/**
 * 서버 용량 막대 — 0 → 권장 상한 → 위험선을 한 줄로 그리고, 설정·바꿀 값·실제 적용이 어느
 * 구간인지 보인다. 초록(바로 반영) · 주황(확인 뒤, 서버가 늘어나면 반영) · 빗금(받지 않음).
 * 평소 설정(기본 15)은 권장 상한보다 훨씬 작아서, 막대는 권장 상한 조금 위까지만 그린다 —
 * 위험선까지 그리면 작은 값이 왼쪽 끝에 붙어 안 보인다. 설정·바꿀 값이 더 크면 그 값까지
 * 늘리고, 위험선은 막대 안에 들어올 때만 찍고 아니면 오른쪽 끝에 글자로만 둔다.
 */
export function CapacityBar({
  capacity,
  setting,
  draft,
  applied,
}: CapacityBarProps) {
  const { recommendedMax, dangerLine, readyTasks, warmingTasks } = capacity
  const scale =
    Math.max(recommendedMax * 1.25, setting ?? 0, draft ?? 0, applied ?? 0) *
    1.1
  const at = (value: number) =>
    `${Math.min(100, Math.max(0, (value / scale) * 100))}%`

  const okWidth = at(recommendedMax)
  const dangerInView = dangerLine !== null && dangerLine < scale

  // ponytail: 가까운 값의 표시는 글자가 겹친다 — 겹치면 위아래로 엇갈려 두는 걸로 바꾼다.
  const markers = [
    applied !== null &&
      applied !== setting && {
        key: 'applied' as const,
        value: applied,
        label: `적용 ${formatNumber(applied)}`,
      },
    setting !== null && {
      key: 'set' as const,
      value: setting,
      label: `설정 ${formatNumber(setting)}`,
    },
    draft !== null &&
      draft !== setting && {
        key: 'draft' as const,
        value: draft,
        label: `바꿀 값 ${formatNumber(draft)}`,
      },
  ].filter((marker) => marker !== false)

  const servers =
    readyTasks === null
      ? null
      : `사전예약 서버 ${readyTasks}대${warmingTasks ? ` + 늘어나는 중 ${warmingTasks}대` : ''}`

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span>
          <b className={styles.headTitle}>서버 용량</b>
          {servers && ` · ${servers} 기준 추정`}
        </span>
        {capacity.relayBadRatio !== null && (
          <span>
            최근 접수 실패·지연 {Math.round(capacity.relayBadRatio * 100)}%
          </span>
        )}
      </div>
      <div
        className={styles.bar}
        role="img"
        aria-label={[
          `권장 ${formatNumber(recommendedMax)}`,
          dangerLine !== null && `위험 ${formatNumber(dangerLine)}`,
          ...markers.map((marker) => marker.label),
        ]
          .filter(Boolean)
          .join(', ')}
      >
        <div className={styles.zone.ok} style={{ width: okWidth }} />
        {dangerInView ? (
          <>
            <div
              className={styles.zone.warn}
              style={{
                width: `${((dangerLine - recommendedMax) / scale) * 100}%`,
              }}
            />
            <div className={styles.zone.no} />
          </>
        ) : (
          <div className={styles.zone.warnEnd} />
        )}
        {markers.map((marker) => (
          <div
            key={marker.key}
            className={styles.marker[marker.key]}
            style={{ left: at(marker.value) }}
          >
            <span className={styles.markerLabel[marker.key]}>
              {marker.label}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.ticks} aria-hidden="true">
        <span className={styles.tick} style={{ left: 0, transform: 'none' }}>
          0
        </span>
        <span className={styles.tick} style={{ left: okWidth }}>
          권장 {formatNumber(recommendedMax)}
        </span>
        {dangerLine !== null &&
          (dangerInView ? (
            <span className={styles.tick} style={{ left: at(dangerLine) }}>
              위험 {formatNumber(dangerLine)}
            </span>
          ) : (
            <span
              className={styles.tick}
              style={{ left: '100%', transform: 'translateX(-100%)' }}
            >
              위험 {formatNumber(dangerLine)} →
            </span>
          ))}
      </div>
    </div>
  )
}
