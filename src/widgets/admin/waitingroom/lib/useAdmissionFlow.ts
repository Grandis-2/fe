import {
  useReservationStats,
  useReservationStatsHistory,
} from '@entities/admin-reservation'
import type { WaitingroomStatus } from '@entities/admin-waitingroom'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import { admissionSignals } from './admissionSignals'
import { admissionVerdict, type AdmissionVerdict } from './admissionVerdict'

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0)

/**
 * 지금 입장 흐름 — 대기열 현황과 예약 집계를 합쳐 맨 위 판정과 입장 속도 카드가 같은 값을
 * 보게 한다. 접수·외부 등록 처리 속도는 서버가 주지 않아, 받은 집계를 쌓아 화면에서 잰다.
 */
export function useAdmissionFlow(
  view: WaitingroomStatus | undefined,
  refreshInterval: RefreshInterval,
) {
  const stats = useReservationStats(undefined, refreshInterval)
  const signals = admissionSignals(
    useReservationStatsHistory().map(({ at, value }) => ({
      at,
      value: {
        received: sum(value.preorders),
        // 외부 등록을 마친 예약. 등록 뒤 취소된 건은 빠져 처리 속도를 조금 낮게 잰다.
        processed: value.preorders.REGISTERED + value.preorders.RESERVED,
        // 재처리 필요(DEAD_LETTER)도 원장으로는 PENDING_SYNC지만 처리 중이 아니라 뺀다.
        backlog: Math.max(
          0,
          value.preorders.PENDING_SYNC - value.syncJobs.REGISTER.DEAD_LETTER,
        ),
      },
    })),
  )

  const waiting = (view?.products ?? []).reduce(
    (total, product) => total + product.waiting,
    0,
  )
  const admitting = view?.globalCredit ?? 0
  // 대기열 현황을 못 받았으면 0명·0명/초로 판정하지 않는다 — 실패를 '따라가요'로 읽게 된다.
  const verdict: AdmissionVerdict = !view
    ? {
        kind: 'unknown',
        tone: 'muted',
        title: '대기열 현황을 받지 못했어요',
        hint: '현황이 오면 다시 판단해요',
      }
    : admissionVerdict({
        waiting,
        stale: view.snapshotStale,
        brakeFactor: view.brakeFactor,
        admitting,
        signals,
      })

  return { stats, waiting, admitting, signals, verdict }
}

export type AdmissionFlow = Omit<ReturnType<typeof useAdmissionFlow>, 'stats'>
