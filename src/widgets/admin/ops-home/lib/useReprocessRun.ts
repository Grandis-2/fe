import { useEffect, useRef, useState } from 'react'

import {
  PartialReprocessError,
  useReprocessFailedRegistrations,
  useReservationStats,
} from '@entities/admin-reservation'
import { formatNumber } from '@shared/lib/formatNumber'
import { showToast } from '@shared/model/toastStore'

import {
  reprocessProgress,
  type ReprocessProgress,
  type ReprocessRun,
} from './reprocessProgress'

// 집계를 다시 받는 간격 — 대시보드의 집계 간격과 같다(같은 캐시를 쓴다).
const POLL_MS = 5_000

/** 부분 실패로 받아들여진 만큼(앞 묶음들)의 합계 — 다시 보낼 때 실행에 더한다 */
type Accepted = PartialReprocessError['accepted']

const resultMessage = (run: ReprocessRun, progress: ReprocessProgress) =>
  progress.failed === 0
    ? `외부 등록 실패 ${formatNumber(run.target)}건을 모두 다시 등록했어요.`
    : progress.mostlyFailed
      ? `재처리한 ${formatNumber(run.target)}건 중 ${formatNumber(progress.failed)}건이 또 실패했어요. 개발팀에 알려 주세요.`
      : `${formatNumber(progress.succeeded)}건을 다시 등록했어요. ${formatNumber(progress.failed)}건은 또 실패했어요.`

/**
 * 운영 대시보드의 일괄 재처리 — 모달 확인 → 진행 → 결과. 모달을 닫아도 서버는 계속하므로
 * 진행은 대시보드가 들고 있고, 닫힌 채로 끝나면 토스트로 한 번 알린다.
 *
 * 범위는 실행을 누른 시점에 고른 상품으로 run에 고정한다. 진행 중에 화면에서 고르기를 바꾸거나
 * 상품이 마감돼 목록에서 빠져도 같은 범위의 집계를 따로 받아 센다.
 * 부분 실패(앞 묶음만 접수)는 접수된 만큼을 기록해 두고, 다시 누르면 보내지 못한 예약만 보낸다.
 * @param selected 지금 화면에서 고른 상품(전체면 null)
 */
export function useReprocessRun(selected: string | null) {
  const mutation = useReprocessFailedRegistrations()
  const [run, setRun] = useState<ReprocessRun | null>(null)
  const [open, setOpen] = useState(false)
  // 부분 실패 뒤 보내지 못한 예약과, 그 전에 접수된 합계(같은 범위일 때만 이어 쓴다)
  const unsentRef = useRef<{
    scope: string | null
    preorderIds: string[]
    accepted: Accepted
  } | null>(null)

  // 진행 중이면 시작할 때 고른 범위, 아니면 지금 고른 범위의 집계를 본다.
  const stats = useReservationStats(
    (run ? run.scope : selected) ?? undefined,
    POLL_MS,
  )
  const countsOf = (data: NonNullable<typeof stats.data>) => ({
    deadLetter: data.syncJobs.REGISTER.DEAD_LETTER,
    inFlight:
      data.syncJobs.REGISTER.PENDING +
      data.syncJobs.REGISTER.PROCESSING +
      data.syncJobs.REGISTER.RETRY_SCHEDULED,
  })
  const counts = stats.data ? countsOf(stats.data) : null
  const progress = run && reprocessProgress(run, counts, stats.dataUpdatedAt)
  const finished = progress?.finished ?? false

  // 같은 재처리를 두 번 알리지 않게 알린 것의 시작 시각을 남긴다.
  const notifiedRef = useRef<number | null>(null)
  useEffect(() => {
    if (!run || !progress || !finished || open) return
    if (notifiedRef.current === run.startedAt) return
    notifiedRef.current = run.startedAt
    showToast(resultMessage(run, progress))
  }, [run, progress, finished, open])

  return {
    open,
    run,
    /** 진행 중(모달을 닫아도 계속) — 끝나면 null */
    running: run !== null && !finished ? progress : null,
    /** 끝난 결과 — 모달이 열려 있을 때만 보인다 */
    result: run !== null && finished ? progress : null,
    isPending: mutation.isPending,
    error: mutation.error,
    /** 지난 재처리가 끝났으면 지우고 새로 확인부터 연다 */
    show: () => {
      if (finished) {
        setRun(null)
        mutation.reset()
      }
      setOpen(true)
    },
    close: () => {
      setOpen(false)
      // 요청이 나가 있으면 그대로 둔다 — reset하면 결과를 받을 콜백이 떨어지고 pending이 풀려 중복 제출이 열린다.
      if (mutation.isPending) return
      // 진행 중이 아니면 다음엔 확인부터 연다.
      if (!run || finished) {
        setRun(null)
        mutation.reset()
      }
    },
    start: (productId: string | null) => {
      // 지금 보고 있는 집계가 곧 시작 전 기준이다 — 그사이 이미 기다리던 건은 뺀다.
      const inFlightAtStart = counts?.inFlight ?? 0
      const retry =
        unsentRef.current?.scope === productId ? unsentRef.current : null
      mutation.mutate(
        { productId: productId ?? undefined, preorderIds: retry?.preorderIds },
        {
          onSuccess: (sent) => {
            unsentRef.current = null
            const before = retry?.accepted
            setRun({
              target: sent.targetCount + (before?.targetCount ?? 0),
              skipped: sent.skippedCount + (before?.skippedCount ?? 0),
              estimatedSeconds:
                sent.estimatedSeconds + (before?.estimatedSeconds ?? 0),
              startedAt: Date.now(),
              scope: productId,
              inFlightAtStart,
            })
          },
          onError: (caught) => {
            if (!(caught instanceof PartialReprocessError)) return
            const before = retry?.accepted
            unsentRef.current = {
              scope: productId,
              preorderIds: caught.unsentPreorderIds,
              accepted: {
                targetCount:
                  caught.accepted.targetCount + (before?.targetCount ?? 0),
                skippedCount:
                  caught.accepted.skippedCount + (before?.skippedCount ?? 0),
                estimatedSeconds:
                  caught.accepted.estimatedSeconds +
                  (before?.estimatedSeconds ?? 0),
              },
            }
          },
        },
      )
    },
  }
}
