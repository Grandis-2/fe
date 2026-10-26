import { useState } from 'react'

import { Timer } from 'lucide-react'

import * as styles from './QueueCard.css'

export type QueueCardProps = {
  myOrderNumber: string
  waitTime: string
  progressPercent: number
  totalWaitingCount: string
  // 1초에 입장하는 인원('8명', '1명 미만'). 모르면 비운다.
  admitPerSecond?: string | null
  // '나가기'를 한 번 더 확인한 뒤에만 호출된다.
  onLeave: () => void
  className?: string
}

export function QueueCard({
  myOrderNumber,
  waitTime,
  progressPercent,
  totalWaitingCount,
  admitPerSecond,
  onLeave,
  className,
}: QueueCardProps) {
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const clampedPercent = Math.max(0, Math.min(100, progressPercent))

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.orderGroup}>
        <span className={styles.label}>나의 대기 순서</span>
        {/* 순번이 바뀌면 숫자와 '번'만 묶어 읽어 준다 — 예상 시간·전체 인원까지 넣으면 몇 초마다 길게 읽혀 시끄럽다. */}
        <div className={styles.orderRow} aria-live="polite" aria-atomic="true">
          <span className={styles.orderNumber}>{myOrderNumber}</span>
          <span className={styles.orderUnit}>번</span>
        </div>
        <span className={styles.label}>
          예상 대기 시간 <span className={styles.strong}>{waitTime}</span>
        </span>
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="대기 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedPercent)}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      <div className={styles.totalRow}>
        {admitPerSecond != null && (
          <span className={styles.pace}>
            입장 속도 초당{' '}
            <span className={styles.strong}>{admitPerSecond}</span>
          </span>
        )}
        <span>
          전체 대기인원{' '}
          <span className={styles.strong}>{totalWaitingCount}</span>명
        </span>
      </div>

      <div className={styles.notice}>
        <Timer size={14} aria-hidden="true" className={styles.noticeIcon} />
        창을 닫아도 순번은 유지돼요. 차례가 오면 예약 페이지로 이동해요.
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
