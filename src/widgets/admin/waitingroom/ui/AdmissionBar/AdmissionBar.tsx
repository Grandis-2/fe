import * as styles from './AdmissionBar.css'

import type { AdmissionTone } from '../../lib/admissionVerdict'

export type AdmissionBarProps = {
  /** 실제 적용 중인 초당 입장 인원 */
  admitting: number
  /** 관측한 초당 외부 등록 처리 건수 — 세로선으로 긋는다 */
  processing: number
  /** 바꿀 값. 주면 지금 값과의 차이를 빗금으로 겹친다 */
  next?: number | null
  tone: AdmissionTone
}

const pct = (value: number, axis: number) =>
  `${Math.round((value / axis) * 1000) / 10}%`

/**
 * 입장 속도 여유 막대 — 채운 부분이 지금 입장, 세로선이 외부 등록 처리 속도다. 숫자를
 * 읽지 않아도 선까지 얼마나 남았는지로 올려도 되는지가 보인다. 바꿀 값을 주면 지금과의
 * 차이를 빗금으로 겹쳐, 선을 넘는지 미리 보인다.
 */
export function AdmissionBar({
  admitting,
  processing,
  next,
  tone,
}: AdmissionBarProps) {
  const hasNext = next != null && next !== admitting
  // 막대 끝에 여유를 둬 선·빗금이 끝에 붙지 않게 한다.
  const axis = Math.max(processing, admitting, next ?? 0, 1) * 1.15
  const over = hasNext && next > processing

  return (
    <div className={styles.root}>
      <div
        className={styles.track}
        role="img"
        aria-label={`입장 초당 ${admitting}명, 외부 등록 처리 초당 ${processing}건${hasNext ? `, 바꾸면 ${next}명` : ''}`}
      >
        <div
          className={styles.fill[tone]}
          style={{ width: pct(admitting, axis) }}
        />
        {hasNext && (
          <div
            className={styles.preview[over ? 'over' : 'within']}
            style={{
              left: pct(Math.min(admitting, next), axis),
              width: pct(Math.abs(next - admitting), axis),
            }}
          />
        )}
        <div
          className={styles.capLine}
          style={{ left: pct(processing, axis) }}
        />
      </div>
      <div className={styles.labels} aria-hidden="true">
        <span
          className={styles.labelStrong}
          style={{ left: pct(admitting, axis) }}
        >
          지금 {admitting}
        </span>
        <span className={styles.label} style={{ left: pct(processing, axis) }}>
          처리 {processing}
        </span>
      </div>
    </div>
  )
}
