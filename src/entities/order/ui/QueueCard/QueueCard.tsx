import { useState } from 'react'

import { Timer } from 'lucide-react'

import * as styles from './QueueCard.css'

export type QueueCardProps = {
  myOrderNumber: string
  waitTime: string
  progressPercent: number
  totalWaitingCount: string
  // '나가기'를 한 번 더 확인한 뒤에만 호출된다.
  onLeave: () => void
  className?: string
}

export function QueueCard({
  myOrderNumber,
  waitTime,
  progressPercent,
  totalWaitingCount,
  onLeave,
  className,
}: QueueCardProps) {
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const clampedPercent = Math.max(0, Math.min(100, progressPercent))

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.orderGroup}>
        <span className={styles.label}>나의 대기 순서</span>
        <div className={styles.orderRow}>
          <span className={styles.orderNumber}>{myOrderNumber}</span>
          <span className={styles.orderUnit}>번</span>
        </div>
        <span className={styles.label}>
          예상 대기 시간 <span className={styles.strong}>{waitTime}</span>
        </span>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      <div className={styles.totalRow}>
        전체 대기인원 <span className={styles.strong}>{totalWaitingCount}</span>
        명
      </div>

      <div className={styles.notice}>
        <Timer size={14} aria-hidden="true" className={styles.noticeIcon} />
        모달창을 닫으면 5분 동안 순번이 유지됩니다.
      </div>

      {confirmingLeave ? (
        <div className={styles.confirm}>
          <div className={styles.confirmText}>나가면 현재 순번이 사라져요.</div>
          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.stayButton}
              onClick={() => setConfirmingLeave(false)}
            >
              계속 대기
            </button>
            <button
              type="button"
              className={styles.leaveConfirmButton}
              onClick={onLeave}
            >
              나가기
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.leaveButton}
          onClick={() => setConfirmingLeave(true)}
        >
          대기열 나가기
        </button>
      )}
    </div>
  )
}
