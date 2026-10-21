import {
  useReservationStats,
  useReservationStatsHistory,
} from '@entities/admin-reservation'
import type { WaitingroomStatus } from '@entities/admin-waitingroom'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import { ratePerSecond, slopePerSecond } from '@shared/lib/samples'

import { admissionVerdict, type AdmissionVerdict } from './admissionVerdict'

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
  // 외부 등록을 마친 예약(결제 대기 + 결제 완료)이 늘어나는 속도. 접수 전체에서 대기를 빼면
  // 외부 등록 없이 취소된 예약까지 처리로 세어진다. 등록 뒤 취소된 건은 빠져 조금 낮게
  // 재지만, 판정이 올려도 된다고 잘못 말하는 쪽보다는 낫다.
  const processed = ratePerSecond(
    series((value) => value.preorders.REGISTERED + value.preorders.RESERVED),
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
  // 결제 기한이 지나 빠지는 예약이 많으면 잠깐 음수가 될 수 있어 0 아래로는 두지 않는다.
  const processing =
    processed === undefined ? null : Math.max(0, Math.round(processed))
  // 대기열 현황을 못 받았으면 0명·0명/초로 판정하지 않는다 — 실패를 '여유 있어요'로 읽게 된다.
  const verdict: AdmissionVerdict = !view
    ? {
        tone: 'muted',
        title: '대기열 현황을 받지 못했어요',
        hint: '현황이 오면 다시 판단해요',
      }
    : admissionVerdict({
        waiting,
        stale: view.snapshotStale,
        brakeFactor: view.brakeFactor,
        backlogPerMinute: backlogSlope === undefined ? null : backlogSlope * 60,
        backlog: stats.data?.preorders.PENDING_SYNC ?? 0,
        admitting,
        processing,
        receiving: received ?? 0,
      })

  return { stats, waiting, admitting, processing, verdict }
}

export type AdmissionFlow = Omit<ReturnType<typeof useAdmissionFlow>, 'stats'>
