import {
  useReservationStats,
  useReservationStatsHistory,
} from '@entities/admin-reservation'
import type { WaitingroomStatus } from '@entities/admin-waitingroom'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import { ratePerSecond, slopePerSecond } from '@shared/lib/samples'

import { admissionVerdict } from './admissionVerdict'

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0)

/**
 * 지금 입장 흐름 — 대기열 현황과 예약 집계를 합쳐 맨 위 판정과 입장 속도 카드가 같은 값을
 * 보게 한다. 외부 등록 처리 속도는 서버가 주지 않아, 받은 집계를 쌓아 화면에서 잰다(처음
 * 30초쯤은 표본이 모자라 null).
 */
export function useAdmissionFlow(
  view: WaitingroomStatus | undefined,
  refreshInterval: RefreshInterval,
) {
  const stats = useReservationStats(undefined, refreshInterval)
  const history = useReservationStatsHistory()
  const series = (pick: (value: (typeof history)[number]['value']) => number) =>
    history.map(({ at, value }) => ({ at, value: pick(value) }))
  const received = ratePerSecond(series((value) => sum(value.preorders))).at(
    -1,
  )?.value
  const processed = ratePerSecond(
    series((value) => sum(value.preorders) - value.preorders.PENDING_SYNC),
  ).at(-1)?.value
  const backlogSlope = slopePerSecond(
    series((value) => value.preorders.PENDING_SYNC),
    60_000,
  ).at(-1)?.value

  const waiting = (view?.products ?? []).reduce(
    (total, product) => total + product.waiting,
    0,
  )
  const admitting = view?.globalCredit ?? 0
  const processing = processed === undefined ? null : Math.round(processed)
  const verdict = admissionVerdict({
    waiting,
    brakeFactor: view?.brakeFactor ?? null,
    backlogPerMinute: backlogSlope === undefined ? null : backlogSlope * 60,
    backlog: stats.data?.preorders.PENDING_SYNC ?? 0,
    admitting,
    processing,
    receiving: received ?? 0,
  })

  return { stats, waiting, admitting, processing, verdict }
}

export type AdmissionFlow = Omit<ReturnType<typeof useAdmissionFlow>, 'stats'>
