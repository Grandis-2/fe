import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  CreateDrawRequest,
  Draw,
  DrawListParams,
  DrawPage,
  DrawProgress,
} from '@shared/api/types'

const BASE = '/api/v1/admin/draws'

/** 회차 한 쪽(최신순). page는 0부터, size는 1~100 */
export const getAdminDraws = (params: DrawListParams, signal?: AbortSignal) =>
  apiClient.request<DrawPage>(`${BASE}${toQueryString(params)}`, { signal })

export const getAdminDraw = (drawId: string, signal?: AbortSignal) =>
  apiClient.request<Draw>(`${BASE}/${encodeURIComponent(drawId)}`, { signal })

/** 응모 수와 추첨 진행 — 마감 뒤 결과가 왜 없는지 볼 때 쓴다 */
export const getAdminDrawProgress = (drawId: string, signal?: AbortSignal) =>
  apiClient.request<DrawProgress>(
    `${BASE}/${encodeURIComponent(drawId)}/progress`,
    { signal },
  )

/**
 * 회차를 만든다. 같은 키로 다시 보내면 새로 만들지 않고 처음 회차를 200으로 돌려준다
 * — 본문은 비교하지 않으니 다른 회차는 새 키로 보낸다.
 */
export const createAdminDraw = (
  idempotencyKey: string,
  body: CreateDrawRequest,
) =>
  apiClient.request<Draw>(BASE, {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
