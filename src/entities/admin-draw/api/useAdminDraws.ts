import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { fetchAllPages, PAGE_SIZE_MAX } from '@shared/api/fetchAllPages'
import { pollEvery, pollingRetry, queryPolicy } from '@shared/api/queryPolicy'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import { useIdempotencyKey } from '@shared/lib/useIdempotencyKey'

import { toCreateDrawRequest, type AdminDrawFormValue } from '../model/form'
import { drawStageOf, isDrawSettled } from '../model/stage'

import {
  createAdminDraw,
  getAdminDraw,
  getAdminDrawProgress,
  getAdminDraws,
} from './adminDraw'

import type { AdminDraw } from '../model/types'

const ADMIN_DRAWS_KEY = ['admin', 'draws'] as const

/**
 * 회차 전체. 단계 필터가 화면에서 걸러서 쪽을 끝까지 이어 받는다 — 회차는 많아야 수십
 * 개다. 단계(phase)는 응답 시점 값이라 재고(live)처럼 매번 다시 받는다.
 */
export const useAdminDraws = (
  /** 자동으로 다시 받는 간격. 운영 대시보드처럼 열어 두는 화면이 준다 */
  intervalMs: RefreshInterval = false,
) => {
  const queryClient = useQueryClient()
  const queryKey = [...ADMIN_DRAWS_KEY, 'list'] as const
  return useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      fetchAllPages((page) =>
        getAdminDraws({ page, size: PAGE_SIZE_MAX }, signal),
      ),
    ...queryPolicy.live,
    // 실패하면 그 간격에서 백오프하며 다시 묻는다.
    ...pollEvery(queryClient, queryKey, intervalMs),
  })
}

export const useAdminDraw = (drawId: string) =>
  useQuery({
    queryKey: [...ADMIN_DRAWS_KEY, 'detail', drawId] as const,
    queryFn: ({ signal }) => getAdminDraw(drawId, signal),
    ...queryPolicy.live,
  })

const progressQuery = (drawId: string) => ({
  queryKey: [...ADMIN_DRAWS_KEY, 'progress', drawId] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    getAdminDrawProgress(drawId, signal),
  ...queryPolicy.live,
})

/** 응모·추첨 진행. 결과가 반영되면 더 바뀔 게 없어 자동 갱신을 멈춘다 */
export const useAdminDrawProgress = (
  drawId: string,
  intervalMs: RefreshInterval,
) => {
  const queryClient = useQueryClient()
  const { queryKey, ...query } = progressQuery(drawId)
  // 보여 줄 진행이 아직 없거나 결과가 반영됐으면 폴링 중이 아니다.
  const pollMs = (
    data: Awaited<ReturnType<typeof getAdminDrawProgress>> | undefined,
  ) =>
    !data || intervalMs === false || isDrawSettled(data) ? null : intervalMs
  return useQuery({
    queryKey,
    ...query,
    refetchInterval: ({ state: { data } }) => pollMs(data) ?? false,
    ...pollingRetry(() => pollMs(queryClient.getQueryData(queryKey))),
  })
}

/**
 * 결과가 나올 시간이 지났는데 반영이 안 된 회차만 골라낸다. 멈췄는지는 회차마다 진행을
 * 받아야 알 수 있다. 진행은 한 번만 받는다 — 멈춘 회차는 저절로 풀리지 않는다.
 * @returns stuck: 멈춘 회차, isPending: 진행을 아직 다 못 받았다
 */
export const useStuckDraws = (draws: readonly AdminDraw[], now: number) => {
  const queries = useQueries({
    queries: draws.map((draw) => progressQuery(draw.drawId)),
  })
  return {
    stuck: draws.filter((draw, index) => {
      const progress = queries[index]?.data
      return progress && drawStageOf(draw, progress, now) === 'STUCK'
    }),
    isPending: queries.some((query) => query.isPending),
  }
}

/** 서버가 본문을 보고 거절해 회차가 안 생긴 게 확실한 실패 — 고쳐서 새 키로 보낸다 */
const isRejected = (caught: unknown) =>
  caught instanceof ApiRequestError &&
  (caught.status === 400 || caught.status === 404 || caught.status === 409)

/**
 * 회차를 만든다. 만들면 당첨 인원만큼 재고를 확보하고 고치거나 지울 수 없다.
 *
 * 키는 응답을 받을 때까지 유지한다. 응답을 못 받았거나(네트워크·타임아웃) 500·503이면
 * 이미 만들어졌을 수 있어서, 다시 누르면 같은 키를 보낸다 — 서버는 같은 키면 처음 회차를
 * 돌려준다. 400·404·409는 만들지 않은 게 확실해 키를 버린다.
 *
 * 같은 키는 본문을 비교하지 않아서, 결과를 모르는 채 내용을 고쳐 보내면 고친 내용이
 * 무시되고 처음 회차가 온다. 새 키로 보내면 회차가 둘이 될 수 있다. 그래서 보내지 않고
 * DrawUnconfirmedError를 던진다 — 화면이 목록 확인을 안내한 뒤 startOver()로 키를 버린다.
 */
export const useCreateAdminDraw = () => {
  const queryClient = useQueryClient()
  const idempotency = useIdempotencyKey()

  const mutation = useMutation({
    mutationFn: (value: AdminDrawFormValue) => {
      const request = toCreateDrawRequest(value)
      const key = idempotency.keyFor(request)
      if (key === null) throw new DrawUnconfirmedError()
      return createAdminDraw(key, request)
    },
    onSuccess: () => {
      idempotency.forget()
      return queryClient.invalidateQueries({ queryKey: ADMIN_DRAWS_KEY })
    },
    onError: (caught) => {
      if (isRejected(caught)) idempotency.forget()
    },
  })

  return {
    ...mutation,
    /** 이전 요청 결과를 확인했다 — 다음 제출은 새 키로 보낸다 */
    startOver: idempotency.forget,
  }
}

/** 이전 요청의 결과를 모르는데 내용이 바뀌었다 — 새로 보낼지 관리자가 정해야 한다 */
export class DrawUnconfirmedError extends Error {
  constructor() {
    super(
      '이전 요청의 결과를 확인하지 못했습니다. 회차 목록에서 이미 만들어졌는지 확인해 주세요.',
    )
    this.name = 'DrawUnconfirmedError'
  }
}
