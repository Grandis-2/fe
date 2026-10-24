import { formatShortDateTime } from '@shared/lib/formatDotDate'
import { formatNumber } from '@shared/lib/formatNumber'

/** 예약 집계 표본 하나를 부하 검증이 보는 값으로 */
export type StatsPoint = {
  at: number
  /** 접수 누적 */
  received: number
  /** 외부 등록을 마친 누적 */
  processed: number
  /** 외부 등록을 기다리는 중(재처리 필요는 뺌) */
  backlog: number
  /** 외부 등록 실패 + 상태 반영 실패 */
  failures: number
}

/** 대기열 현황 표본 하나 */
export type QueuePoint = {
  at: number
  waiting: number
  /** 실제 초당 입장 */
  credit: number
  brakeFactor: number | null
  braking: boolean
}

/** [구간 기록 시작]을 누른 때 */
export type ActiveRecording = {
  startedAt: number
  condition: string
  /** 시작 때 실패 누적 — 끝날 때 빼서 구간 동안 늘어난 만큼을 센다 */
  baselineFailures: number | null
}

export type RecordedWindow = {
  startedAt: number
  endedAt: number
  condition: string
  maxWaiting: number | null
  maxCredit: number | null
  avgProcessed: number | null
  maxBacklog: number | null
  newFailures: number | null
  result: '통과' | '적체' | '실패' | '판단 못 함'
}

const maxOf = (values: number[]) => (values.length ? Math.max(...values) : null)

/**
 * 구간 동안 받은 표본으로 한 줄 요약을 만든다. 표본은 최대 30분만 남아, 그보다 긴 구간은
 * 앞부분이 빠진 채로 센다(실패 수는 시작 때 값과 비교해 그대로 맞다).
 */
export function summarizeWindow(
  active: ActiveRecording,
  endedAt: number,
  stats: readonly StatsPoint[],
  queue: readonly QueuePoint[],
): RecordedWindow {
  const inWindow = <T extends { at: number }>(points: readonly T[]) =>
    points.filter(({ at }) => at >= active.startedAt && at <= endedAt)
  const s = inWindow(stats)
  const q = inWindow(queue)
  const first = s[0]
  const last = s.at(-1)
  const seconds = first && last ? (last.at - first.at) / 1000 : 0
  const newFailures =
    last && active.baselineFailures !== null
      ? Math.max(0, last.failures - active.baselineFailures)
      : null
  const result: RecordedWindow['result'] =
    newFailures === null || !first || !last
      ? '판단 못 함'
      : newFailures > 0
        ? '실패'
        : last.backlog > first.backlog
          ? '적체'
          : '통과'
  return {
    startedAt: active.startedAt,
    endedAt,
    condition: active.condition,
    maxWaiting: maxOf(q.map((point) => point.waiting)),
    maxCredit: maxOf(q.map((point) => point.credit)),
    avgProcessed:
      first && last && seconds > 0
        ? Math.max(0, (last.processed - first.processed) / seconds)
        : null,
    maxBacklog: maxOf(s.map((point) => point.backlog)),
    newFailures,
    result,
  }
}

/** 브레이크가 걸린 동안을 이어진 구간으로 묶는다(차트 빗금 띠) */
export function brakeBands(queue: readonly QueuePoint[]) {
  const bands: { from: number; to: number; label: string }[] = []
  let run: { from: number; to: number; min: number } | null = null
  for (const point of queue) {
    if (point.braking) {
      const factor = point.brakeFactor ?? 1
      if (run) {
        run.to = point.at
        run.min = Math.min(run.min, factor)
      } else run = { from: point.at, to: point.at, min: factor }
      continue
    }
    if (run)
      bands.push({
        from: run.from,
        to: point.at,
        label: `브레이크 ${run.min}×`,
      })
    run = null
  }
  if (run)
    bands.push({ from: run.from, to: run.to, label: `브레이크 ${run.min}×` })
  return bands
}

/** 구간 길이 — '6분', 1분이 안 되면 '40초' */
export const durationLabel = (ms: number) => {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return seconds < 60 ? `${seconds}초` : `${Math.round(seconds / 60)}분`
}

const valueOf = (value: number | null, unit: string) =>
  value === null ? '—' : `${formatNumber(Math.round(value))}${unit}`

/** [결과 복사] — PR·메신저에 그대로 붙이는 한 덩어리 글 */
export const recordText = (record: RecordedWindow, grafanaUrl: string) =>
  [
    `부하 검증 ${formatShortDateTime(new Date(record.startedAt).toISOString())} · ${durationLabel(record.endedAt - record.startedAt)} · ${record.condition}`,
    `판정 ${record.result}`,
    `최대 대기 ${valueOf(record.maxWaiting, '명')} · 최대 입장 ${valueOf(record.maxCredit, '명/초')}`,
    `평균 처리 ${valueOf(record.avgProcessed, '건/초')} · 최대 적체 ${valueOf(record.maxBacklog, '건')} · 새 실패 ${valueOf(record.newFailures, '건')}`,
    `Grafana ${grafanaUrl}`,
  ].join('\n')
