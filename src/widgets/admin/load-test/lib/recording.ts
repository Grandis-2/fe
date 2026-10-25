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
  /** 누른 시각(벽시계) — 받은 표본 시각이 아니다. 폴링이 멈춰도 구간 길이가 줄지 않는다 */
  startedAt: number
  /** 기록한 범위의 상품. 전체면 null — 다른 범위의 표본으로 끝내지 않게 한다 */
  productId: string | null
  /** 표에 적을 범위 이름 — '전체', '아이폰 18 Pro' */
  scopeLabel: string
  condition: string
  /** 시작 때 실패 누적 — 끝날 때 빼서 구간 동안 늘어난 만큼을 센다 */
  baselineFailures: number | null
}

export type RecordedWindow = Pick<
  ActiveRecording,
  'startedAt' | 'scopeLabel' | 'condition'
> & {
  endedAt: number
  /**
   * 구간 처음·끝에 표본이 있었는지. 새로 고침(표본은 메모리에만 있다)·30분 넘는 구간·폴링
   * 실패로 앞뒤가 비면 false — 최대·평균은 있는 표본만으로 센 값이다
   */
  complete: boolean
  maxWaiting: number | null
  maxCredit: number | null
  avgProcessed: number | null
  maxBacklog: number | null
  newFailures: number | null
  result: '통과' | '적체' | '실패' | '판단 못 함'
}

const maxOf = (values: number[]) => (values.length ? Math.max(...values) : null)

// 구간 끝에서 이보다 멀리 떨어진 첫·마지막 표본이면 그 사이가 빈 것으로 본다(폴링 5초의 세 배).
const EDGE_GAP_MS = 15_000

/**
 * 구간 동안 받은 표본으로 한 줄 요약을 만든다. 앞뒤가 비면 있는 표본만으로 세고 complete를
 * 끈다(실패 수는 시작 때 값과 비교해 그대로 맞다).
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
    scopeLabel: active.scopeLabel,
    condition: active.condition,
    complete:
      !!first &&
      !!last &&
      first.at - active.startedAt <= EDGE_GAP_MS &&
      endedAt - last.at <= EDGE_GAP_MS,
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

// 이만큼 안에 다시 걸린 브레이크는 한 띠로 본다 — 배율이 1 근처를 오가면 띠가 잘게 쪼개져
// 이름이 다닥다닥 붙는다.
const BRAKE_MERGE_GAP_MS = 30_000

/** 브레이크가 걸린 동안을 이어진 구간으로 묶는다(차트 빗금 띠). 이름엔 가장 낮은 배율을 붙인다 */
export function brakeBands(queue: readonly QueuePoint[]) {
  const runs: { from: number; to: number; min: number }[] = []
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
    // 풀린 표본까지 띠를 늘린다 — 그 사이 어딘가에서 풀렸다.
    if (run) runs.push({ ...run, to: point.at })
    run = null
  }
  if (run) runs.push(run)

  const merged: typeof runs = []
  for (const next of runs) {
    const prev = merged.at(-1)
    if (prev && next.from - prev.to <= BRAKE_MERGE_GAP_MS) {
      prev.to = next.to
      prev.min = Math.min(prev.min, next.min)
    } else merged.push({ ...next })
  }
  return merged.map(({ from, to, min }) => ({
    from,
    to,
    label: `브레이크 ${min}×`,
  }))
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
    `부하 검증 ${formatShortDateTime(new Date(record.startedAt).toISOString())} · ${durationLabel(record.endedAt - record.startedAt)} · ${record.scopeLabel} · ${record.condition}`,
    `판정 ${record.result}${record.complete ? '' : ' (표본 일부 빠짐)'}`,
    `최대 대기 ${valueOf(record.maxWaiting, '명')} · 최대 입장 ${valueOf(record.maxCredit, '명/초')}`,
    `평균 처리 ${valueOf(record.avgProcessed, '건/초')} · 최대 적체 ${valueOf(record.maxBacklog, '건')} · 새 실패 ${valueOf(record.newFailures, '건')}`,
    `Grafana ${grafanaUrl}`,
  ].join('\n')
