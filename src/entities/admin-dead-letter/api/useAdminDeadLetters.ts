import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
import type { DeadLetterListParams, DeadLetterStatus } from '@shared/api/types'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import { deadLetterStatuses, isRedriveInFlight } from '../model/types'

import {
  discardDeadLetter,
  getDeadLetter,
  getDeadLetters,
  redriveDeadLetter,
  redriveDeadLetters,
} from './adminDeadLetter'

const DEAD_LETTERS_KEY = ['admin', 'dead-letters'] as const
// 예약 집계(stats)의 DLQ 대기 수와 예약 상세가 같이 바뀐다.
const RESERVATIONS_KEY = ['admin', 'reservations'] as const
// 되돌리기 결과를 기다리는 동안만 쓰는 짧은 간격.
const IN_FLIGHT_POLL_MS = 3_000

/**
 * 메시지 목록. intervalMs를 주면 그 간격으로, 안 주면 되돌리기 결과를 기다리는 행이 있을
 * 때만 다시 받는다.
 */
export const useDeadLetters = (
  params: DeadLetterListParams = {},
  intervalMs?: RefreshInterval,
) => {
  const queryClient = useQueryClient()
  const queryKey = [...DEAD_LETTERS_KEY, 'list', params] as const
  // 보여 줄 목록이 아직 없으면 폴링 중이 아니다(첫 조회는 한 번만 다시 묻는다).
  const pollMs = (
    data: Awaited<ReturnType<typeof getDeadLetters>> | undefined,
  ) => {
    if (!data) return null
    if (intervalMs !== undefined)
      return intervalMs === false ? null : intervalMs
    return data.items.some((item) => isRedriveInFlight(item.status))
      ? IN_FLIGHT_POLL_MS
      : null
  }
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getDeadLetters(params, signal),
    ...queryPolicy.live,
    refetchInterval: ({ state: { data } }) => pollMs(data) ?? false,
    ...pollingRetry(() => pollMs(queryClient.getQueryData(queryKey))),
  })
}

/**
 * 상태마다 몇 건인지 — 탭 옆 숫자. 목록 API가 상태 하나씩만 걸러서 상태마다 한 건만
 * 달라고 해 total을 쓴다. 못 받은 상태는 undefined라 화면이 0과 구분한다.
 */
export const useDeadLetterCounts = (intervalMs?: RefreshInterval) =>
  useQueries({
    queries: deadLetterStatuses.map((status) => ({
      queryKey: [...DEAD_LETTERS_KEY, 'count', status] as const,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getDeadLetters({ status, size: 1 }, signal),
      ...queryPolicy.live,
      refetchInterval: intervalMs ?? false,
    })),
    combine: (results) =>
      Object.fromEntries(
        deadLetterStatuses.map((status, index) => [
          status,
          results[index].data?.total,
        ]),
      ) as Record<DeadLetterStatus, number | undefined>,
  })

/** 메시지 상세. 되돌리기 결과를 기다리는 동안만 다시 받는다 */
export const useDeadLetter = (deadLetterId: string) =>
  useQuery({
    queryKey: [...DEAD_LETTERS_KEY, 'detail', deadLetterId] as const,
    queryFn: ({ signal }) => getDeadLetter(deadLetterId, signal),
    ...queryPolicy.live,
    refetchInterval: (query) =>
      query.state.data && isRedriveInFlight(query.state.data.status)
        ? IN_FLIGHT_POLL_MS
        : false,
  })

// 메시지 상태와 예약(상태·집계)이 같이 바뀌므로 둘 다 다시 받는다.
const useInvalidateAfterChange = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: DEAD_LETTERS_KEY }),
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_KEY }),
    ])
}

export const useRedriveDeadLetter = () => {
  const invalidate = useInvalidateAfterChange()
  return useMutation({ mutationFn: redriveDeadLetter, onSuccess: invalidate })
}

export const useRedriveDeadLetters = () => {
  const invalidate = useInvalidateAfterChange()
  return useMutation({ mutationFn: redriveDeadLetters, onSuccess: invalidate })
}

export const useDiscardDeadLetter = () => {
  const invalidate = useInvalidateAfterChange()
  return useMutation({
    mutationFn: ({
      deadLetterId,
      note,
    }: {
      deadLetterId: string
      note: string
    }) => discardDeadLetter(deadLetterId, { note }),
    onSuccess: invalidate,
  })
}
