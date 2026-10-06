import { apiClient } from '@shared/api/client'
import type {
  AdminMemberListResponse,
  AdminReservationListParams,
  AdminStatsResponse,
  Paged,
  ReservationSummary,
} from '@shared/api/types'

const BASE = '/api/v1/admin/reservations'

const toQuery = (params: AdminReservationListParams) => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export const getAdminReservations = (
  params: AdminReservationListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<Paged<ReservationSummary>>(`${BASE}${toQuery(params)}`, {
    signal,
  })

export const getAdminStats = (runId?: string, signal?: AbortSignal) =>
  apiClient.request<AdminStatsResponse>(
    `/api/v1/admin/stats${runId ? `?runId=${runId}` : ''}`,
    { signal },
  )

// ponytail: 재처리 엔드포인트는 명세에 없다(shared/api/mock/handlers/
// admin-reservation.ts의 같은 주석 참고). 계약이 나오면 함께 고친다.
// 응답 본문은 쓰지 않는다 — 호출부가 목록을 다시 받아 표 전체를 갱신한다.
export const reprocessAdminReservation = (reservationId: string) =>
  apiClient.request<unknown>(`${BASE}/${reservationId}/reprocess`, {
    method: 'POST',
  })

export const getAdminMembers = (keyword?: string, signal?: AbortSignal) =>
  apiClient.request<AdminMemberListResponse>(
    `/api/v1/admin/members${keyword ? `?q=${encodeURIComponent(keyword)}` : ''}`,
    { signal },
  )
