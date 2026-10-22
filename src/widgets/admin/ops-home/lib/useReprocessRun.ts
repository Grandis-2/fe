import { useEffect, useRef, useState } from 'react'

import { useReprocessFailedRegistrations } from '@entities/admin-reservation'
import { formatNumber } from '@shared/lib/formatNumber'
import { showToast } from '@shared/model/toastStore'

import {
  reprocessProgress,
  type RegisterCounts,
  type ReprocessProgress,
  type ReprocessRun,
} from './reprocessProgress'

const resultMessage = (run: ReprocessRun, progress: ReprocessProgress) =>
  progress.failed === 0
    ? `외부 등록 실패 ${formatNumber(run.target)}건을 모두 다시 등록했어요.`
    : progress.mostlyFailed
      ? `재처리한 ${formatNumber(run.target)}건 중 ${formatNumber(progress.failed)}건이 또 실패했어요. 개발팀에 알려 주세요.`
      : `${formatNumber(progress.succeeded)}건을 다시 등록했어요. ${formatNumber(progress.failed)}건은 또 실패했어요.`

/**
 * 운영 대시보드의 일괄 재처리 — 모달 확인 → 진행 → 결과. 모달을 닫아도 서버는 계속하므로
 * 진행은 대시보드가 들고 있고, 닫힌 채로 끝나면 토스트로 한 번 알린다.
 */
export function useReprocessRun(
  /** 재처리 범위(고른 사전예약 또는 전체)의 외부 등록 집계. 못 받았으면 null */
  counts: RegisterCounts | null,
  /** 그 집계를 낸 쿼리의 갱신 시각 — 다른 쿼리(추첨 목록 등)의 시각을 넣으면 안 된다 */
  countsAt: number,
) {
  const mutation = useReprocessFailedRegistrations()
  const [run, setRun] = useState<ReprocessRun | null>(null)
  const [open, setOpen] = useState(false)
  const progress = run && reprocessProgress(run, counts, countsAt)
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
    start: (productId: string | null) =>
      mutation.mutate(productId ?? undefined, {
        onSuccess: ({ targetCount, skippedCount, estimatedSeconds }) =>
          setRun({
            target: targetCount,
            skipped: skippedCount,
            estimatedSeconds,
            startedAt: Date.now(),
          }),
      }),
  }
}
