import type { Sample } from '@shared/lib/samples'

/**
 * 밀리는지 볼 기간. 임시값이다 — 집계가 5초마다 와서 15~20초보다 짧으면 출렁임과 구분이
 * 안 되고, 길면 늦게 알아챈다. 부하 시험으로 정상 흔들림을 재서 다시 정한다.
 */
export const CONGESTION_WINDOW_MS = 30_000

// 기간 안의 표본이 이 비율만큼 덮어야 그 기간으로 잰다. 폴링이 끊기면 기록 앞부분과 사이가 떠서
// 짧은 구간 값으로 판단하지 않게 한다.
const COVERAGE = 0.9

/** 집계 하나에서 뽑은 세 값 — 모두 누적·현재 건수다 */
export type FlowCounts = {
  /** 지금까지 접수된 예약(모든 상태 합) */
  received: number
  /** 외부 등록을 마친 예약(결제 대기 + 결제 완료) */
  processed: number
  /** 외부 등록을 기다리는 예약(재처리 필요는 뺀다) */
  backlog: number
}

export type AdmissionSignals = {
  /** 마지막 표본 시각(ms). 표본이 없으면 null */
  at: number | null
  /** 속도를 잰 기간(초). 표본이 둘 미만이면 0 */
  coveredSeconds: number
  /** 초당 접수. 표본이 둘 미만이면 null */
  received: number | null
  /** 초당 외부 등록 처리. 표본이 둘 미만이면 null */
  processed: number | null
  /** 지금 외부 등록 대기. 표본이 없으면 null */
  backlog: number | null
  /** 외부 등록 대기의 분당 변화(늘면 +). 표본이 둘 미만이면 null */
  backlogPerMinute: number | null
  /** 판단할 만큼 기록이 쌓였는지. 아니면 judgedInSeconds 뒤에 판단한다 */
  judged: boolean
  judgedInSeconds: number
  /** 기간 내내 외부 등록 대기가 줄지 않고 늘었다 = 처리가 접수를 못 따라간다 */
  congested: boolean
  /**
   * 처리 한계 — 밀리는 동안 잰 처리 속도. 그때만 워커가 쉬지 않아 최대치다. 기록 안에서
   * 가장 최근에 밀린 때의 값이고, 밀린 적이 없으면 null.
   */
  limit: { perSecond: number; at: number } | null
}

const EMPTY: AdmissionSignals = {
  at: null,
  coveredSeconds: 0,
  received: null,
  processed: null,
  backlog: null,
  backlogPerMinute: null,
  judged: false,
  judgedInSeconds: CONGESTION_WINDOW_MS / 1000,
  congested: false,
  limit: null,
}

/**
 * 받은 집계 기록(시각 순)으로 접수·처리 속도와 밀림을 잰다. 표본마다 직전 기간
 * (CONGESTION_WINDOW_MS) 안의 가장 오래된 표본과 비교한다.
 */
export function admissionSignals(
  samples: readonly Sample<FlowCounts>[],
  windowMs = CONGESTION_WINDOW_MS,
): AdmissionSignals {
  const last = samples.at(-1)
  if (!last) return EMPTY
  let from = 0
  let limit: AdmissionSignals['limit'] = null
  let current = {
    received: 0,
    processed: 0,
    backlogDelta: 0,
    congested: false,
    seconds: 0,
  }
  samples.forEach((sample, index) => {
    while (from < index && sample.at - samples[from].at > windowMs) from += 1
    const base = samples[from]
    const seconds = (sample.at - base.at) / 1000
    const rate = (key: 'received' | 'processed') =>
      seconds > 0
        ? Math.max(0, (sample.value[key] - base.value[key]) / seconds)
        : 0
    // 기간 내내 줄지 않고, 처음보다 늘었으면 밀림이다.
    let rising = sample.value.backlog > base.value.backlog
    for (let i = from + 1; rising && i <= index; i += 1)
      rising = samples[i].value.backlog >= samples[i - 1].value.backlog
    const congested = seconds * 1000 >= windowMs * COVERAGE && rising
    current = {
      received: rate('received'),
      processed: rate('processed'),
      backlogDelta: sample.value.backlog - base.value.backlog,
      congested,
      seconds,
    }
    if (congested) limit = { perSecond: current.processed, at: sample.at }
  })

  const measured = samples.length >= 2 && current.seconds > 0
  // 판단은 마지막 표본의 기간이 얼마나 채워졌는지로 한다(처음부터 쌓인 기록이 아니라).
  const coveredMs = current.seconds * 1000
  return {
    at: last.at,
    coveredSeconds: Math.round(current.seconds),
    received: measured ? current.received : null,
    processed: measured ? current.processed : null,
    backlog: last.value.backlog,
    backlogPerMinute: measured
      ? (current.backlogDelta / current.seconds) * 60
      : null,
    judged: coveredMs >= windowMs * COVERAGE,
    judgedInSeconds: Math.max(0, Math.ceil((windowMs - coveredMs) / 1000)),
    congested: current.congested,
    limit,
  }
}
