import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { pollingRetry, queryPolicy } from '@shared/api/queryPolicy'

import { enterQueue, getQueueStatus, submitPreorder } from './queue'
import { reservationKeys } from './useReservations'

import type { QueuePoll } from '../model/queue'

// Retry-After가 빠졌을 때(일시 장애 뒤 등) 쓰는 간격 — 명세가 503 재시도에 권하는 값.
const FALLBACK_RETRY_SECONDS = 2

// WAITING인 동안 서버가 정한 간격(Retry-After)으로 묻는다. ADMITTED·CLOSED면 멈춘다(null).
const pollMs = (data: QueuePoll | undefined) =>
  data?.status === 'WAITING'
    ? (data.retryAfter ?? FALLBACK_RETRY_SECONDS) * 1000
    : null

// 진입은 조회가 아니라 줄을 세우는 명령이라 mutation이다(자동 재시도 없음).
export const useEnterQueue = () => useMutation({ mutationFn: enterQueue })

// 대기 순번 조회. 진입 응답(entry)을 첫 값으로 깔아 두고, 응답의 Retry-After초가 지나면 다시 묻는다.
// WAITING이 아니면(ADMITTED·CLOSED) 멈춘다. 조회가 곧 생존 신호라 탭이 백그라운드여도 계속 묻는다.
// 실패하면 마지막 Retry-After에서 백오프하며 제한 없이 다시 묻는다 — 250초가 지나도 서버가 아직
// 자리를 지키고 있을 수 있고, 빠졌으면 회복 뒤 응답(CLOSED NOT_IN_QUEUE)이 다시 줄 세운다.
// enteredAt을 키에 넣어 다시 진입할 때마다 새 캐시로 시작한다 — 같은 토큰이 다시 와도 지난 CLOSED가 남지 않게.
export const useQueueStatus = (
  productId: string,
  entry: Extract<QueuePoll, { status: 'WAITING' }> | undefined,
  enteredAt: number,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const queryClient = useQueryClient()
  const queryKey = [
    'preorder-queue',
    productId,
    entry?.queueToken,
    enteredAt,
  ] as const
  return useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      getQueueStatus(productId, entry?.queueToken ?? '', signal),
    enabled: enabled && Boolean(entry?.queueToken),
    initialData: entry,
    refetchInterval: ({ state: { data } }) => pollMs(data) ?? false,
    refetchIntervalInBackground: true,
    ...queryPolicy.polling,
    ...pollingRetry(
      () => pollMs(queryClient.getQueryData<QueuePoll>(queryKey)),
      { retries: 2 },
    ),
  })
}

// 접수는 돈·순번이 걸린 명령이라 자동 재시도하지 않는다 — 재전송은 같은 Idempotency-Key로 사용자가 다시 누른다.
// 접수되면 내 예약 목록이 바뀌므로 다시 받는다.
export const useSubmitPreorder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: submitPreorder,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
  })
}
