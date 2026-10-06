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
    'status' | 'ahead' | 'waitTime' | 'holdSeconds' | 'reopen'
  >
}

const MESSAGE: Record<QueueStatus, (ahead: number) => string> = {
  waiting: (ahead) => `내 앞 ${formatNumber(ahead)}명`,
  mine: () => '내 차례예요 · 지금 예약하기',
  expired: () => '순번이 만료되었어요',
}

const pad = (n: number) => String(n).padStart(2, '0')

// 대기열 모달을 닫아 둔 동안 위에 떠서 순번·남은 유지 시간을 보여 준다. 누르면 모달이 다시 열린다.
export function QueuePill({ productName, queue }: QueuePillProps) {
  const { status, ahead, waitTime, holdSeconds, reopen } = queue
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
      <span className={styles.text}>{MESSAGE[status](ahead)}</span>
      {status === 'waiting' && (
        <span className={styles.desktopOnly}>
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.text}>
            예상 대기 <span className={styles.strong}>{waitTime}</span>
          </span>
        </span>
      )}
      <span className={styles.timer[warn ? 'warn' : 'normal']}>
        <Timer size={13} aria-hidden="true" />
        {pad(Math.floor(holdSeconds / 60))}:{pad(holdSeconds % 60)}
      </span>
    </button>
  )
}
