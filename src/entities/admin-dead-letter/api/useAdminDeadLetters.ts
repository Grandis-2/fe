import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { pollEvery, pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
import type { DeadLetterListParams, DeadLetterStatus } from '@shared/api/types'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import {
  deadLetterStatuses,
  isRedriveInFlight,
  type DeadLetterService,
} from '../model/types'

import {
  discardDeadLetter,
  getDeadLetter,
  getDeadLetters,
  getDeadLettersOf,
  redriveDeadLetter,
  redriveDeadLetters,
} from './adminDeadLetter'

const DEAD_LETTERS_KEY = ['admin', 'dead-letters'] as const
// 메시지가 바뀌면 그 서비스의 화면도 같이 바뀐다 — 예약은 집계(DLQ 대기 수)·예약 상세, 결제는
// 주문(환불 상태).
const RELATED_KEY: Record<DeadLetterService, readonly string[]> = {
  preorder: ['admin', 'reservations'],
  payment: ['admin', 'orders'],
}
// 되돌리기 결과를 기다리는 동안만 쓰는 짧은 간격.
const IN_FLIGHT_POLL_MS = 3_000

/** 목록 조건. statuses를 주면 그 상태들을 끝까지 받아 합치고(손댈 것만 모은 탭), 아니면 한 쪽만 */
export type DeadLetterQuery = DeadLetterListParams & {
  statuses?: readonly DeadLetterStatus[]
}

/**
 * 메시지 목록. intervalMs를 주면 그 간격으로, 안 주면 되돌리기 결과를 기다리는 행이 있을
 * 때만 다시 받는다.
 */
export const useDeadLetters = (
  service: DeadLetterService,
  params: DeadLetterQuery = {},
  intervalMs?: RefreshInterval,
) => {
  const queryClient = useQueryClient()
  const queryKey = [...DEAD_LETTERS_KEY, service, 'list', params] as const
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
    queryFn: ({ signal }) => {
      const { statuses, ...listParams } = params
      return statuses
        ? getDeadLettersOf(service, statuses, listParams, signal)
        : getDeadLetters(service, listParams, signal)
    },
    ...queryPolicy.live,
    refetchInterval: ({ state: { data } }) => pollMs(data) ?? false,
    ...pollingRetry(() => pollMs(queryClient.getQueryData(queryKey))),
  })
}

/**
 * 상태마다 몇 건인지 — 탭 옆 숫자. 목록 API가 상태 하나씩만 걸러서 상태마다 한 건만
 * 달라고 해 total을 쓴다. 목록과 같은 조건(이벤트·실패 이유)으로 세야 숫자가 보이는 목록과
 * 맞는다. 못 받은 상태는 undefined라 화면이 0과 구분한다.
 */
export const useDeadLetterCounts = (
  service: DeadLetterService,
  filters: Pick<
    DeadLetterListParams,
    'eventType' | 'failureReason' | 'from' | 'to'
  >,
  intervalMs?: RefreshInterval,
) => {
  const queryClient = useQueryClient()
  return useQueries({
    queries: deadLetterStatuses.map((status) => {
      const queryKey = [
        ...DEAD_LETTERS_KEY,
        service,
        'count',
        status,
        filters,
      ] as const
      return {
        queryKey,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getDeadLetters(service, { ...filters, status, size: 1 }, signal),
        ...queryPolicy.live,
        ...pollEvery(queryClient, queryKey, intervalMs ?? false),
      }
    }),
    combine: (results) =>
      Object.fromEntries(
        deadLetterStatuses.map((status, index) => [
          status,
          results[index].data?.total,
        ]),
      ) as Record<DeadLetterStatus, number | undefined>,
  })
}

/** 메시지 상세. 되돌리기 결과를 기다리는 동안만 다시 받는다 */
export const useDeadLetter = (
  service: DeadLetterService,
  deadLetterId: string,
) => {
  const queryClient = useQueryClient()
  const queryKey = [
    ...DEAD_LETTERS_KEY,
    service,
    'detail',
    deadLetterId,
  ] as const
  const pollMs = (
    data: Awaited<ReturnType<typeof getDeadLetter>> | undefined,
  ) => (data && isRedriveInFlight(data.status) ? IN_FLIGHT_POLL_MS : null)
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => getDeadLetter(service, deadLetterId, signal),
    ...queryPolicy.live,
    refetchInterval: ({ state: { data } }) => pollMs(data) ?? false,
    ...pollingRetry(() => pollMs(queryClient.getQueryData(queryKey))),
  })
}

// 메시지 상태와 그 서비스의 화면이 같이 바뀌므로 둘 다 다시 받는다(다른 서비스 DLQ는 그대로).
const useInvalidateAfterChange = (service: DeadLetterService) => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: [...DEAD_LETTERS_KEY, service],
      }),
      queryClient.invalidateQueries({ queryKey: RELATED_KEY[service] }),
    ])
}

export const useRedriveDeadLetter = (service: DeadLetterService) => {
  const invalidate = useInvalidateAfterChange(service)
  return useMutation({
    mutationFn: (deadLetterId: string) =>
      redriveDeadLetter(service, deadLetterId),
    onSuccess: invalidate,
  })
}

export const useRedriveDeadLetters = (service: DeadLetterService) => {
  const invalidate = useInvalidateAfterChange(service)
  return useMutation({
    mutationFn: (deadLetterIds: string[]) =>
      redriveDeadLetters(service, deadLetterIds),
    onSuccess: invalidate,
  })
}

export const useDiscardDeadLetter = (service: DeadLetterService) => {
  const invalidate = useInvalidateAfterChange(service)
  return useMutation({
    mutationFn: ({
      deadLetterId,
      note,
    }: {
      deadLetterId: string
      note: string
    }) => discardDeadLetter(service, deadLetterId, { note }),
    onSuccess: invalidate,
  })
}
