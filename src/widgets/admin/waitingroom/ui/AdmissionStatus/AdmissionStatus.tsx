import { waitEstimate } from '@entities/admin-waitingroom'
import { formatNumber } from '@shared/lib/formatNumber'
import { Skeleton } from '@shared/ui'

import * as styles from './AdmissionStatus.css'

import type { AdmissionFlow } from '../../lib/useAdmissionFlow'

export type AdmissionStatusProps = {
  flow: AdmissionFlow
  loading: boolean
  /** 급할 때만 붙는 할 일 — 입장 멈춤엔 다시 열기, 처리보다 빠르면 속도 낮추기 */
  action?: { label: string; onClick: () => void; disabled?: boolean }
}

/**
 * 대기열 관리 맨 위 판정 줄 — 색 · 한 문장 · 숫자 넷으로 지금 상태를 먼저 말한다. 아래
 * 카드들은 이 판정을 보고 무엇을 바꿀지 고르는 곳이다.
 */
export function AdmissionStatus({
  flow,
  loading,
  action,
}: AdmissionStatusProps) {
  if (loading) return <Skeleton height={132} radius={14} />

  const { verdict, waiting, admitting, processing } = flow
  return (
    <section className={styles.root[verdict.tone]} aria-label="지금 상태">
      <div className={styles.verdict}>
        <span className={styles.dot[verdict.tone]} aria-hidden="true" />
        <span className={styles.title[verdict.tone]}>{verdict.title}</span>
        <span className={styles.hint}>{verdict.hint}</span>
        {action && (
          <button
            type="button"
            className={styles.action}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
      <dl className={styles.kpis}>
        <div className={styles.kpi}>
          <dt className={styles.kpiLabel}>기다리는 사람</dt>
          <dd className={styles.kpiValue}>
            {formatNumber(waiting)}
            <span className={styles.unit}>명</span>
          </dd>
        </div>
        <div className={styles.kpi}>
          <dt className={styles.kpiLabel}>맨 뒤 예상 대기</dt>
          <dd className={styles.kpiValue}>
            {waitEstimate(waiting, admitting) ?? '대기 없음'}
          </dd>
        </div>
        <div className={styles.kpi}>
          <dt className={styles.kpiLabel}>지금 입장</dt>
          <dd className={styles.kpiValue}>
            {formatNumber(admitting)}
            <span className={styles.unit}>명/초</span>
          </dd>
        </div>
        <div className={styles.kpi}>
          <dt className={styles.kpiLabel}>외부 등록 처리</dt>
          <dd className={styles.kpiValue}>
            {processing === null ? (
              '재는 중'
            ) : (
              <>
                {formatNumber(processing)}
                <span className={styles.unit}>건/초</span>
              </>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}
