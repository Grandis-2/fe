import { useEffect, useRef, useState } from 'react'

import {
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
import { retryOf, unsentAfterError, type Unsent } from './reprocessRetry'

// 집계를 다시 받는 간격 — 대시보드의 집계 간격과 같다(같은 캐시를 쓴다).
const POLL_MS = 5_000

// 결과 문구는 "모두 다시 등록"이라 단정하지 않는다. 보낸 작업의 결과는 집계로 셀 수 없어서,
// 재처리 필요 건수가 얼마나 줄었는지와 확인할 곳만 알린다.
const resultMessage = (progress: ReprocessProgress) => {
  const { deadLetterAtStart: before, deadLetterNow: now } = progress
  const counts =
    before !== null && now !== null
      ? ` 재처리 필요 ${formatNumber(before)}건 → ${formatNumber(now)}건.`
      : ''
  return `재처리 요청을 마쳤어요.${counts} 결과는 예약 현황의 재처리 필요 탭에서 확인해 주세요.`
}

/**
 * 운영 대시보드의 일괄 재처리 — 모달 확인 → 진행 → 결과. 모달을 닫아도 서버는 계속하므로
 * 진행은 대시보드가 들고 있고, 닫힌 채로 끝나면 토스트로 한 번 알린다.
 *
 * 범위는 실행을 누른 시점에 고른 상품으로 run에 고정한다. 진행 중에 화면에서 고르기를 바꾸거나
 * 상품이 마감돼 목록에서 빠져도 같은 범위의 집계를 따로 받아 센다.
 * 부분 실패(앞 묶음만 접수)는 접수된 만큼을 기록해 두고, 다시 누르면 보내지 못한 예약만 보낸다.
 * 그 밖의 오류가 나면 남은 목록을 비운다.
 * @param selected 지금 화면에서 고른 상품(전체면 null)
 */
export function useReprocessRun(selected: string | null) {
  const mutation = useReprocessFailedRegistrations()
  const [run, setRun] = useState<ReprocessRun | null>(null)
  const [open, setOpen] = useState(false)
  const unsentRef = useRef<Unsent | null>(null)

  // 진행 중이면 시작할 때 고른 범위, 아니면 지금 고른 범위의 집계를 본다.
  const stats = useReservationStats(
    (run ? run.scope : selected) ?? undefined,
    POLL_MS,
  )
  const deadLetterNow = stats.data
    ? stats.data.syncJobs.REGISTER.DEAD_LETTER
    : null
  // 집계 시각은 서버가 센 시각(countedAt)을 쓴다 — 받은 시각(dataUpdatedAt)은 캐시된 옛 값도 새로 보인다.
  const countedAt = stats.data ? Date.parse(stats.data.countedAt) : 0
  const progress = run && reprocessProgress(run, deadLetterNow, countedAt)
  const finished = progress?.finished ?? false

  // 같은 재처리를 두 번 알리지 않게 알린 것의 시작 시각을 남긴다.
  const notifiedRef = useRef<number | null>(null)
  useEffect(() => {
    if (!run || !progress || !finished || open) return
    if (notifiedRef.current === run.startedAt) return
    notifiedRef.current = run.startedAt
    showToast(resultMessage(progress))
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
      const retry = retryOf(unsentRef.current, productId)
      // 이어 보내는 중이면 처음 시작 때의 건수와 비교한다 — 앞 묶음이 이미 줄여 놓았기 때문이다.
      const deadLetterAtStart = retry ? retry.deadLetterAtStart : deadLetterNow
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
              deadLetterAtStart,
            })
          },
          // 부분 실패면 보내지 못한 것을, 그 밖의 오류면 비운다(옛 목록을 다음 실행이 쓰지 않게).
          onError: (caught) => {
            unsentRef.current = unsentAfterError(
              retry,
              productId,
              deadLetterAtStart,
              caught,
            )
          },
        },
      )
    },
  }
}
