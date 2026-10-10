import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  PreorderCancelRequest,
  PreorderCancelResult,
  PreorderEventListResponse,
  PreorderListParams,
  PreorderPage,
} from '@shared/api/types'

import type { ReservationDetail } from '../model/reservation'

const path = (preorderId: string) =>
  `/api/v1/preorders/${encodeURIComponent(preorderId)}`

// 내 예약 — 최신순, 취소된 예약 포함. 커서 페이지(nextCursor가 null이면 마지막).
export const getMyReservations = (
  params: PreorderListParams,
  signal?: AbortSignal,
) =>
  apiClient.request<PreorderPage>(`/api/v1/preorders${toQueryString(params)}`, {
    signal,
  })

// 예약 상세 — 접수 뒤 폴링하는 대상. 남의 예약은 404.
export const getReservation = (preorderId: string, signal?: AbortSignal) =>
  apiClient.request<ReservationDetail>(path(preorderId), { signal })

// 상태 변경 이력(eventSequence 순, 페이지 없음).
export const getReservationHistory = async (
  preorderId: string,
  signal?: AbortSignal,
) =>
  (
    await apiClient.request<PreorderEventListResponse>(
      `${path(preorderId)}/history`,
      { signal },
    )
  ).items

// 취소 — 202는 시작됐다는 뜻이고 완료는 비동기다. 다시 보내도 안전하다(이미 취소 중이면 지금 상태).
export const cancelReservation = ({
  preorderId,
  ...body
}: PreorderCancelRequest & { preorderId: string }) =>
  apiClient.request<PreorderCancelResult>(`${path(preorderId)}/cancel`, {
    method: 'POST',
    body,
  })
