import { formatNumber } from '@shared/lib/formatNumber'

import { TIGHT_RATIO } from '../../lib/admissionVerdict'

import * as styles from './AdmissionBar.css'

export type AdmissionBarProps = {
  /** 실제 적용 중인 초당 입장 인원 */
  admitting: number
  /** 관측한 초당 외부 등록 처리 건수 — 세로선으로 긋는다 */
  processing: number
  /** 바꿀 값. 주면 지금 값과의 차이를 빗금으로 겹친다 */
  next?: number | null
}

const pct = (value: number, axis: number) =>
  `${Math.round((value / axis) * 1000) / 10}%`

/** 라벨을 어느 쪽에 붙일지 — 끝 가까이면 그쪽으로 붙여 막대 밖으로 넘치지 않게 한다 */
const alignOf = (value: number, axis: number) =>
  value / axis < 0.2 ? 'start' : value / axis > 0.8 ? 'end' : 'center'

/**
 * 입장 속도 여유 막대 — 바탕을 여유(초록) · 한계 근처(노랑) · 처리보다 빠름(빨강) 세 구간으로
 * 칠하고, 채운 막대가 지금 입장, 세로선이 외부 등록 처리 속도다. 막대 끝이 어느 색에 있는지만
 * 보면 올려도 되는지 읽힌다. 바꿀 값을 주면 지금과의 차이를 빗금으로 겹친다(바꿀 숫자는 입력
 * 칸에 있어 라벨은 달지 않는다). 처리 한계는 막대 위, 지금은 아래에 달아 둘이 가까워도 안 겹친다.
 */
export function AdmissionBar({
  admitting,
  processing,
  next,
}: AdmissionBarProps) {
  const hasNext = next != null && next !== admitting
  // 처리선 뒤에도 빨간 구간이 보이게 여유를 둔다.
  const axis = Math.max(processing * 1.4, admitting, next ?? 0, 1) * 1.05
  const tight = processing * TIGHT_RATIO

  return (
    <div className={styles.root}>
      <div className={styles.labels} aria-hidden="true">
        <span
          className={styles.labelLine[alignOf(processing, axis)]}
          style={{ left: pct(processing, axis) }}
        >
          처리 한계 {formatNumber(processing)}
        </span>
      </div>
      <div
        className={styles.track}
        role="img"
        aria-label={`입장 초당 ${admitting}명, 외부 등록 처리 초당 ${processing}건${hasNext ? `, 바꾸면 ${next}명` : ''}`}
      >
        <span
          className={styles.zone.ok}
          style={{ left: 0, width: pct(tight, axis) }}
        />
        <span
          className={styles.zone.tight}
          style={{
            left: pct(tight, axis),
            width: pct(processing - tight, axis),
          }}
        />
        <span
          className={styles.zone.over}
          style={{ left: pct(processing, axis), right: 0 }}
        />
        <span className={styles.fill} style={{ width: pct(admitting, axis) }} />
        {hasNext && (
          <span
            className={styles.preview}
            style={{
              left: pct(Math.min(admitting, next), axis),
              width: pct(Math.abs(next - admitting), axis),
            }}
          />
        )}
        <span
          className={styles.capLine}
          style={{ left: pct(processing, axis) }}
        />
      </div>
      <div className={styles.labels} aria-hidden="true">
        <span
          className={styles.labelNow[alignOf(admitting, axis)]}
          style={{ left: pct(admitting, axis) }}
        >
          지금 {formatNumber(admitting)}
        </span>
      </div>
      <div className={styles.legend} aria-hidden="true">
        <span>
          <i className={styles.swatch.ok} />
          여유
        </span>
        <span>
          <i className={styles.swatch.tight} />
          한계 근처
        </span>
        <span>
          <i className={styles.swatch.over} />
          처리보다 빠름 · 외부 등록이 밀려요
        </span>
      </div>
    </div>
  )
}
