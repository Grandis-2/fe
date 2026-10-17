import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { fetchAllPages, PAGE_SIZE_MAX } from '@shared/api/fetchAllPages'
import { pollingInterval, queryPolicy } from '@shared/api/queryPolicy'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import { useIdempotencyKey } from '@shared/lib/useIdempotencyKey'

import { toCreateDrawRequest, type AdminDrawFormValue } from '../model/form'
import { isDrawSettled } from '../model/stage'

import {
  createAdminDraw,
  getAdminDraw,
  getAdminDrawProgress,
  getAdminDraws,
} from './adminDraw'

const ADMIN_DRAWS_KEY = ['admin', 'draws'] as const

/**
 * 회차 전체. 단계 필터가 화면에서 걸러서 쪽을 끝까지 이어 받는다 — 회차는 많아야 수십
 * 개다. 단계(phase)는 응답 시점 값이라 재고(live)처럼 매번 다시 받는다.
 */
export const useAdminDraws = () =>
  useQuery({
    queryKey: [...ADMIN_DRAWS_KEY, 'list'] as const,
    queryFn: ({ signal }) =>
      fetchAllPages((page) =>
        getAdminDraws({ page, size: PAGE_SIZE_MAX }, signal),
      ),
    ...queryPolicy.live,
  })

export const useAdminDraw = (drawId: string) =>
  useQuery({
    queryKey: [...ADMIN_DRAWS_KEY, 'detail', drawId] as const,
    queryFn: ({ signal }) => getAdminDraw(drawId, signal),
    ...queryPolicy.live,
  })

/** 응모·추첨 진행. 결과가 반영되면 더 바뀔 게 없어 자동 갱신을 멈춘다 */
export const useAdminDrawProgress = (
  drawId: string,
  intervalMs: RefreshInterval,
) =>
  useQuery({
    queryKey: [...ADMIN_DRAWS_KEY, 'progress', drawId] as const,
    queryFn: ({ signal }) => getAdminDrawProgress(drawId, signal),
    ...queryPolicy.live,
    refetchInterval: (query) =>
      intervalMs === false || isDrawSettled(query.state.data)
        ? false
        : pollingInterval(intervalMs)(query),
  })

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
