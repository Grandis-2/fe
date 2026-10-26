import type { ReservationEvent } from '@entities/preorder'

import * as styles from './ReservationTimeline.css'

type ReservationTimelineProps = {
  events: readonly ReservationEvent[]
  // 지금 외부 등록을 기다리는 중이면 마지막에 '등록 중' 줄을 붙인다(이력은 상태가 바뀔 때만 생긴다).
  // slow: 오래 걸려(60초) 자동 재시도가 끝났을 수 있다 — '자동 재시도'라고 약속하지 않는다.
  registering: false | 'pending' | 'slow'
}

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const ACTOR_LABEL: Record<ReservationEvent['actor'], string> = {
  USER: '나',
  SYSTEM: '시스템',
  ADMIN: '운영자',
}

// 이력 한 줄의 이름 — 같은 상태로 가는 이력(결제 시작)과 되돌린 이력(취소 거절)은 앞 상태로 가른다.
const eventLabel = ({ fromStatus, toStatus }: ReservationEvent) => {
  switch (toStatus) {
    case 'PENDING_SYNC':
      return '예약 접수'
    case 'REGISTERED':
      return fromStatus === 'PENDING_SYNC'
        ? '외부 예약 시스템 등록 완료'
        : fromStatus === 'REGISTERED'
          ? '결제 시작'
          : '취소 거절 · 예약 유지'
    case 'RESERVED':
      return '결제 확인 · 예약 확정'
    case 'CANCELING':
      return '취소 시작'
    case 'CANCELED':
      return '취소 완료'
  }
}

// 앞 이력에서 걸린 시간. 비동기 처리(접수 → 외부 등록)가 몇 초 걸렸는지 보인다.
const elapsed = (from: string, to: string) => {
  const seconds = (Date.parse(to) - Date.parse(from)) / 1000
  if (seconds < 60) return `+${seconds.toFixed(1)}초`
  // 큰 단위 두 개까지 — 75초는 '1분 15초', 하루는 '24시간'.
  const total = Math.round(seconds)
  const [big, small] =
    total < 3600
      ? [`${Math.floor(total / 60)}분`, `${total % 60}초`]
      : [`${Math.floor(total / 3600)}시간`, `${Math.floor(total / 60) % 60}분`]
  return `+${big}${small.startsWith('0') ? '' : ` ${small}`}`
}

// 예약이 지나온 상태를 시각·처리 주체·걸린 시간과 함께 쌓아 보인다(예약 접수 화면).
export function ReservationTimeline({
  events,
  registering,
}: ReservationTimelineProps) {
  if (events.length === 0) return null
  const sorted = events.toSorted((a, b) => a.eventSequence - b.eventSequence)

  return (
    <section className={styles.root} aria-label="처리 기록">
      <span className={styles.title}>처리 기록</span>
      <ol className={styles.list}>
        {sorted.map((event, index) => (
          <li key={event.eventSequence} className={styles.item}>
            <span className={styles.dot.done} aria-hidden />
            <span className={styles.time}>
              {timeFormat.format(new Date(event.createdAt))}
            </span>
            <span className={styles.label}>{eventLabel(event)}</span>
            {/* 첫 줄은 걸린 시간이 없어 '나' 혼자 남는다 — 내가 접수한 건 당연하니 뺀다(운영자 접수면 남긴다). */}
            {(index > 0 || event.actor !== 'USER') && (
              <span className={styles.meta}>
                {ACTOR_LABEL[event.actor]}
                {index > 0 &&
                  ` · ${elapsed(sorted[index - 1].createdAt, event.createdAt)}`}
              </span>
            )}
          </li>
        ))}
        {registering && (
          <li className={styles.item}>
            <span className={styles.dot.current} aria-hidden />
            <span className={styles.time}>지금</span>
            <span className={styles.label}>외부 예약 시스템에 등록하는 중</span>
            <span className={styles.meta}>
              {registering === 'slow'
                ? '시스템 · 응답 지연 중'
                : '시스템 · 실패하면 자동 재시도'}
            </span>
          </li>
        )}
      </ol>
    </section>
  )
}
