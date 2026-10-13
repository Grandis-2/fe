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
    'status' | 'ahead' | 'waitTime' | 'moveIn' | 'reopen'
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
}

// 대기열 모달을 닫아 둔 동안 위에 떠서 순번을 보여 준다. 누르면 모달이 다시 열린다.
// 닫아 둬도 순번 조회는 계속되므로 자리를 잃지 않는다.
export function QueuePill({ productName, queue }: QueuePillProps) {
  const { status, ahead, waitTime, moveIn, reopen } = queue

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
      {/* 내 차례면 이동까지 남은 초를 센다. */}
      {status === 'mine' && (
        <span className={styles.timer}>{moveIn}초 뒤 이동</span>
      )}
    </button>
  )
}
