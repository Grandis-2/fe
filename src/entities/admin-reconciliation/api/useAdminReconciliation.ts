import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { OffsetPage, ReconciliationRun } from '@shared/api/types'

import { isRunActive } from '../model/types'

import {
  cancelFinding,
  externalCancelFinding,
  externalCancelFindings,
  getReconciliationFindings,
  getReconciliationRuns,
  getRunDiff,
  reprocessFinding,
  startReconciliationRun,
  type FindingQuery,
} from './adminReconciliation'

const RECONCILIATION_KEY = ['admin', 'reconciliation'] as const
const RUNS_KEY = [...RECONCILIATION_KEY, 'runs'] as const
const FINDINGS_KEY = [...RECONCILIATION_KEY, 'findings'] as const
// 검사 중일 때만 짧게 다시 묻는다(실서버 검사는 2~8초).
const ACTIVE_POLL_MS = 3_000
// 평소엔 결과가 검사가 끝날 때만 바뀐다 — 정기·다른 관리자의 검사를 놓치지 않을 만큼만 묻는다.
const IDLE_POLL_MS = 60_000
// 결과 카드에 쓸 최근 완료 검사를 찾을 만큼 — 도는 검사·실패 뒤에 완료가 있다.
const RUNS_SIZE = 10

/**
 * 최근 검사들(요청 순). 결과는 검사가 끝날 때만 바뀌어서 평소엔 1분마다 한 번만 묻고,
 * 검사가 돌고 있으면 끝날 때까지 몇 초마다 묻는다.
 */
export const useReconciliationRuns = () =>
  useQuery({
    queryKey: RUNS_KEY,
    queryFn: ({ signal }) => getReconciliationRuns(RUNS_SIZE, signal),
    select: (page) => page.items,
    ...queryPolicy.live,
    refetchInterval: ({ state: { data } }) =>
      data?.items[0] && isRunActive(data.items[0])
        ? ACTIVE_POLL_MS
        : IDLE_POLL_MS,
  })

/** 검사 하나의 불일치 한 쪽. 쪽·탭을 바꾸는 동안 이전 쪽을 둔다 */
export const useReconciliationFindings = (
  runId: string | undefined,
  query: FindingQuery,
) =>
  useQuery({
    queryKey: [...FINDINGS_KEY, runId, query] as const,
    queryFn: ({ signal }) =>
      getReconciliationFindings(runId ?? '', query, signal),
    enabled: runId !== undefined,
    placeholderData: keepPreviousData,
    ...queryPolicy.live,
  })

/**
 * 검사 요청. 응답이 새 검사(대기)라 목록을 다시 받지 않고 맨 앞에 넣는다 — 그러면 목록이
 * 검사 중이 돼 끝날 때까지 몇 초마다 묻기 시작한다. 409(이미 검사 중)는 지금 도는 검사를
 * 보여 줘야 해서 목록을 다시 받는다.
 */
/**
 * 두 검사의 비교. 끝난 검사끼리라 결과가 바뀌지 않아 다시 묻지 않는다. 둘 중 하나라도
 * 없으면(첫 검사) 묻지 않는다.
 */
export const useReconciliationDiff = (runId?: string, against?: string) =>
  useQuery({
    queryKey: [...RECONCILIATION_KEY, 'diff', runId, against] as const,
    queryFn: ({ signal }) => getRunDiff(runId!, against!, signal),
    enabled: runId !== undefined && against !== undefined,
    ...queryPolicy.catalog,
  })

export const useStartReconciliationRun = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: startReconciliationRun,
    onSuccess: (run) =>
      queryClient.setQueryData<OffsetPage<ReconciliationRun>>(
        RUNS_KEY,
        (prev) =>
          prev && {
            ...prev,
            items: [run, ...prev.items],
            total: prev.total + 1,
          },
      ),
    onError: () => queryClient.invalidateQueries({ queryKey: RUNS_KEY }),
  })
}

// 조치는 그 건의 상태만 바꾼다 — 불일치 목록만 다시 받는다.
const useFindingAction = <TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: FINDINGS_KEY }),
  })
}

export const useExternalCancelFinding = () =>
  useFindingAction(externalCancelFinding)

export const useExternalCancelFindings = () =>
  useFindingAction(externalCancelFindings)

export const useReprocessFinding = () => useFindingAction(reprocessFinding)

export const useCancelFinding = () =>
  useFindingAction(
    ({ findingId, reason }: { findingId: string; reason: string }) =>
      cancelFinding(findingId, reason),
  )
