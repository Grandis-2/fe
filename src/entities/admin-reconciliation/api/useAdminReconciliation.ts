import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { PAGE_SIZE_MAX } from '@shared/api/fetchAllPages'
import { pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
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
export const useReconciliationRuns = () => {
  const queryClient = useQueryClient()
  // 실패하면 이 간격에서 백오프하며 다시 묻는다(평소 1분은 상한보다 길어 그대로다).
  const pollMs = (page: OffsetPage<ReconciliationRun> | undefined) =>
    page?.items[0] && isRunActive(page.items[0]) ? ACTIVE_POLL_MS : IDLE_POLL_MS
  return useQuery({
    queryKey: RUNS_KEY,
    queryFn: ({ signal }) => getReconciliationRuns(RUNS_SIZE, signal),
    select: (page) => page.items,
    ...queryPolicy.live,
    refetchInterval: ({ state: { data } }) => pollMs(data),
    ...pollingRetry(() => {
      const page =
        queryClient.getQueryData<OffsetPage<ReconciliationRun>>(RUNS_KEY)
      // 아직 한 번도 못 받았으면 폴링 중이 아니다(첫 조회는 한 번만 다시 묻는다).
      return page ? pollMs(page) : null
    }),
  })
}

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
// 비교할 앞 검사를 찾아 거슬러 올라가는 쪽 수(100개씩) — 그보다 앞이면 비교하지 않는다.
const PREVIOUS_SEARCH_PAGES = 3

/** 비교할 수 있는 바로 앞 검사 — 같은 범위(productId)이고 더 일찍 요청해 끝난 검사 */
const isPreviousOf =
  (run: ReconciliationRun) => (candidate: ReconciliationRun) =>
    candidate.status === 'COMPLETED' &&
    candidate.runId !== run.runId &&
    candidate.productId === run.productId &&
    candidate.createdAt < run.createdAt

/**
 * run과 비교할 바로 앞 검사. 최근 목록(recent)에 있으면 그것을 쓰고, 없으면(사이에 다른 범위의
 * 검사가 많이 돌았음) 더 앞 쪽을 찾아 본다 — 서버는 범위만 같으면 오래된 검사와도 비교한다.
 * 끝난 검사는 바뀌지 않아 한 번 찾으면 다시 묻지 않는다. 못 찾으면 undefined.
 */
export const usePreviousRun = (
  run: ReconciliationRun | undefined,
  recent: readonly ReconciliationRun[] | undefined,
) => {
  const inRecent = run && recent?.find(isPreviousOf(run))
  const older = useQuery({
    queryKey: [...RUNS_KEY, 'previous', run?.runId] as const,
    queryFn: async ({ signal }) => {
      for (let page = 0; page < PREVIOUS_SEARCH_PAGES; page += 1) {
        const result = await getReconciliationRuns(PAGE_SIZE_MAX, signal, page)
        const found = result.items.find(isPreviousOf(run!))
        if (found) return found
        if ((page + 1) * PAGE_SIZE_MAX >= result.total) break
      }
      return null
    },
    enabled: run !== undefined && recent !== undefined && !inRecent,
    ...queryPolicy.catalog,
  })
  return inRecent ?? older.data ?? undefined
}

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
