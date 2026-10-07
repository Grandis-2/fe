import { Timer } from 'lucide-react'

import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './QueuePill.css'

import type {
  PreorderQueueState,
  QueueStatus,
} from '../../lib/usePreorderQueue'

export type QueuePillProps = {
  productName: string
  queue: Pick<
    PreorderQueueState,
    'status' | 'ahead' | 'waitTime' | 'holdSeconds' | 'moveIn' | 'reopen'
  >
}

// 내 앞이 이만큼 이하가 되면 '곧 내 차례'로 미리 알린다 — 곧 화면이 넘어갈 수 있다는 예고.
const SOON_AHEAD = 10

const MESSAGE: Record<QueueStatus, (ahead: number) => string> = {
  waiting: (ahead) =>
    ahead <= SOON_AHEAD
      ? `곧 내 차례예요 · 내 앞 ${formatNumber(ahead)}명`
      : `내 앞 ${formatNumber(ahead)}명`,
  mine: () => '내 차례예요 · 곧 예약 페이지로 이동해요',
  expired: () => '순번이 만료되었어요',
}

const pad = (n: number) => String(n).padStart(2, '0')

// 대기열 모달을 닫아 둔 동안 위에 떠서 순번·남은 유지 시간을 보여 준다. 누르면 모달이 다시 열린다.
export function QueuePill({ productName, queue }: QueuePillProps) {
  const { status, ahead, waitTime, holdSeconds, moveIn, reopen } = queue
  // 마지막 1분부터는 빨갛게 — 곧 순번이 사라진다는 걸 알린다.
  const warn = status === 'expired' || holdSeconds <= 60

  return (
    <button
      type="button"
      className={[styles.root, styles.border[status]].join(' ')}
      onClick={reopen}
    >
      <span className={styles.dot[status]} aria-hidden="true" />
      <span className={styles.desktopOnly}>
        <span className={styles.product}>{productName} 사전예약</span>
        <span className={styles.divider} aria-hidden="true" />
      </span>
      {/* 순번·이동 예고가 바뀌면 화면을 보지 않는 사용자에게도 읽어 준다. */}
      <span className={styles.text} aria-live="polite">
        {MESSAGE[status](ahead)}
      </span>
      {status === 'waiting' && (
        <span className={styles.desktopOnly}>
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.text}>
            예상 대기 <span className={styles.strong}>{waitTime}</span>
          </span>
        </span>
      )}
      {status === 'mine' ? (
        // 내 차례면 순번 유지 시간 대신 이동까지 남은 초를 센다.
        <span className={styles.timer.normal}>{moveIn}초 뒤 이동</span>
      ) : (
        <span className={styles.timer[warn ? 'warn' : 'normal']}>
          <Timer size={13} aria-hidden="true" />
          {pad(Math.floor(holdSeconds / 60))}:{pad(holdSeconds % 60)}
        </span>
      )}
    </button>
  )
}
