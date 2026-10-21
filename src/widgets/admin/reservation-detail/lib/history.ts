import {
  actorLabel,
  preorderStatusLabel,
  syncJobTypeLabel,
  type ReservationEvent,
  type ReservationSyncJob,
} from '@entities/admin-reservation'

export type HistoryKind = 'status' | 'sync'

export type HistoryEntry = {
  key: string
  kind: HistoryKind
  at: string
  title: string
  /** 누가 — 회원·관리자·시스템·자동 */
  actor: string
  /** 실패한 외부 호출의 오류 */
  error?: string
  /** 관리자 사유 */
  note?: string
}

// 외부 호출 결과. UNKNOWN은 응답을 못 받은 경우다.
const resultLabel = (result: string) =>
  result === 'SUCCEEDED' ? '성공' : result === 'UNKNOWN' ? '응답 없음' : '실패'

/**
 * 상태 이력과 외부 연동 시도를 한 줄로 — 둘 다 "언제 무슨 일이 있었나"라, 따로 두면 두
 * 목록을 오가며 순서를 맞춰야 한다. 최근 것이 위다.
 */
export function historyEntries(
  events: ReservationEvent[],
  jobs: ReservationSyncJob[],
): HistoryEntry[] {
  const statusEntries = events.map((event): HistoryEntry => ({
    key: `event-${event.eventSequence}`,
    kind: 'status',
    at: event.createdAt,
    title: event.fromStatus
      ? `${preorderStatusLabel[event.fromStatus]} → ${preorderStatusLabel[event.toStatus]}`
      : preorderStatusLabel[event.toStatus],
    actor: actorLabel[event.actor],
    note: event.reason ? `사유: ${event.reason}` : undefined,
  }))
  const syncEntries = jobs.flatMap((job) =>
    job.attempts.map((attempt): HistoryEntry => ({
      key: `${job.syncJobId}-${attempt.attemptNumber}`,
      kind: 'sync',
      at: attempt.startedAt,
      title: `${syncJobTypeLabel[job.jobType]} 시도 ${attempt.attemptNumber} · ${resultLabel(attempt.result)}`,
      actor: attempt.actor === 'ADMIN' ? '관리자 재처리' : '자동',
      error: attempt.errorCode
        ? [
            attempt.errorCode,
            attempt.httpStatus && `HTTP ${attempt.httpStatus}`,
            attempt.errorMessage,
          ]
            .filter(Boolean)
            .join(' — ')
        : undefined,
    })),
  )
  return [...statusEntries, ...syncEntries].toSorted(
    (a, b) => Date.parse(b.at) - Date.parse(a.at),
  )
}
