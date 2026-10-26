/**
 * 밀리는지 판단할 만큼 잰 구간. 서버는 최근 1분을 재지만 막 뜬 직후엔 구간이 짧다 —
 * 이보다 짧으면 출렁임과 구분이 안 돼 판단을 미룬다.
 */
export const CONGESTION_WINDOW_MS = 30_000

/** 밀림 문턱의 바닥(분당) — 대기가 거의 없을 때 한두 건 늘어난 걸로 밀린다고 하지 않는다 */
export const CONGESTION_MIN_PER_MIN = 10

/** 무작위 흔들림의 몇 배를 넘어야 밀림으로 볼지 — 3이면 정상 흔들림의 99.7%가 그 안에 든다 */
export const CONGESTION_SIGMAS = 3

/**
 * 밀림으로 볼 외부 등록 대기의 분당 증가. 서버 속도는 잰 구간 처음·끝의 대기 차이라, 잘 따라가는
 * 중에도 그 순간 외부에 등록 중인 건만큼 흔들린다. 그 흔들림보다 크게 늘어야 밀림이다.
 *
 * 흔들림 = 무작위 몫 + 몰림 몫
 * - 무작위 몫: 따라가는 동안엔 대기가 곧 등록 중인 건수(L)다. 접수가 흩어져 들어오면 두 시점
 *   차이의 표준편차가 √(2L)이라 그 CONGESTION_SIGMAS배를 둔다.
 * - 몰림 몫: 대기열이 1초마다 몰아 들이거나 부하 도구가 한꺼번에 보내면, 1초 안에서 대기가 1초치
 *   접수만큼 톱니처럼 오르내린다. 그래서 1초치 접수(초당 접수 × 1초)를 더한다.
 * - 구간이 짧으면(30초) 분당으로 늘린 만큼 흔들림도 커져 60 / 구간(초)을 곱한다.
 * - 바닥 CONGESTION_MIN_PER_MIN: 대기가 거의 없을 때 한두 건으로 밀린다고 하지 않는다.
 *
 * 서버가 주는 값(대기, 초당 접수, 잰 구간)만 써서 상한·등록 지연을 짐작하지 않고, 관리자가 상한을
 * 바꿔도 저절로 맞는다. 서버의 측정 방식을 흉내 낸 시뮬레이션(접수 20~150건/초, 등록 0.5~2초,
 * 흩어짐·1초 몰림, 느린 꼬리 5%)에서 정상인데 밀린다고 한 경우가 없었다. 그 대신 처리가 접수보다
 * 2~3% 넘게 느려야 잡힌다. 그보다 작은 차이는 놓치지만, 그만큼이면 외부 등록까지 걸리는 시간이
 * 1분에 약 1.5초씩만 는다(처리가 접수보다 2.5% 느리면 60초 × 0.025).
 */
export const congestionThreshold = (
  backlog: number,
  receivedPerSec: number,
  windowSeconds: number,
) =>
  Math.max(
    CONGESTION_MIN_PER_MIN,
    ((CONGESTION_SIGMAS * Math.sqrt(2 * Math.max(0, backlog)) +
      Math.max(0, receivedPerSec)) *
      60) /
      Math.max(1, windowSeconds),
  )

/** 운영 현황(GET /admin/preorders/stats)에서 판정에 쓰는 칸만 */
export type FlowStats = {
  countedAt: string
  preorders: { PENDING_SYNC: number }
  syncJobs: { REGISTER: { DEAD_LETTER: number } }
  /** 서버가 잰 최근 1분 속도. 막 떴거나 접수 중이 아니면 null */
  rates: {
    receivedPerSec: number
    registeredPerSec: number
    backlogPerMin: number
    windowSeconds: number
  } | null
}

export type AdmissionSignals = {
  /** 센 시각(ms). 현황을 못 받았으면 null */
  at: number | null
  /** 속도를 잰 구간(초). 속도가 없으면 0 */
  coveredSeconds: number
  /** 초당 접수. 속도가 없으면 null */
  received: number | null
  /** 초당 외부 등록 처리(등록 대기에서 빠져나간 수). 속도가 없으면 null */
  processed: number | null
  /** 지금 외부 등록 대기(재처리 필요는 뺀다). 현황을 못 받았으면 null */
  backlog: number | null
  /** 외부 등록 대기의 분당 변화(늘면 +). 속도가 없으면 null */
  backlogPerMinute: number | null
  /** 판단할 만큼 잰 구간이 찼는지. 아니면 judgedInSeconds 뒤에 판단한다 */
  judged: boolean
  judgedInSeconds: number
  /** 잰 구간 동안 외부 등록 대기가 정상 흔들림을 넘게 늘었다 = 처리가 접수를 못 따라간다 */
  congested: boolean
}

/**
 * 운영 현황에서 접수·처리 속도와 밀림을 꺼낸다. 속도는 서버가 10초 기록으로 잰 값이라 화면을
 * 새로 고쳐도, 관리자마다 같다.
 */
export function admissionSignals(
  stats: FlowStats | undefined,
): AdmissionSignals {
  const rates = stats?.rates ?? null
  const coveredMs = (rates?.windowSeconds ?? 0) * 1000
  const judged = coveredMs >= CONGESTION_WINDOW_MS
  // 재처리 필요(DEAD_LETTER)도 원장으로는 PENDING_SYNC지만 처리 중이 아니라 뺀다.
  const backlog = stats
    ? Math.max(
        0,
        stats.preorders.PENDING_SYNC - stats.syncJobs.REGISTER.DEAD_LETTER,
      )
    : null
  const threshold =
    rates && backlog !== null
      ? congestionThreshold(backlog, rates.receivedPerSec, rates.windowSeconds)
      : null
  return {
    at: stats ? Date.parse(stats.countedAt) : null,
    coveredSeconds: rates?.windowSeconds ?? 0,
    received: rates?.receivedPerSec ?? null,
    processed: rates?.registeredPerSec ?? null,
    backlog,
    backlogPerMinute: rates?.backlogPerMin ?? null,
    judged,
    judgedInSeconds: Math.max(
      0,
      Math.ceil((CONGESTION_WINDOW_MS - coveredMs) / 1000),
    ),
    congested:
      judged && threshold !== null && (rates?.backlogPerMin ?? 0) > threshold,
  }
}
