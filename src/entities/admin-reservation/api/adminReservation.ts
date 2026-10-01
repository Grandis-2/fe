import { apiClient } from '@/shared/api/client'
import type {
  AdminMemberListResponse,
  AdminReservationListParams,
  AdminStatsResponse,
  Paged,
  ReservationCreateRequest,
  ReservationDetail,
  ReservationSummary,
} from '@/shared/api/types'

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

export const getAdminReservations = (params: AdminReservationListParams = {}) =>
  apiClient.request<Paged<ReservationSummary>>(`${BASE}${toQuery(params)}`)

export const getAdminReservation = (reservationId: string) =>
  apiClient.request<ReservationDetail>(`${BASE}/${reservationId}`)

export const getAdminStats = (runId?: string) =>
  apiClient.request<AdminStatsResponse>(
    `/api/v1/admin/stats${runId ? `?runId=${runId}` : ''}`,
  )

// ponytail: 아래 넷은 명세에 없는 임시 계약이다(shared/api/mock/handlers/
// admin-reservation.ts의 같은 주석 참고). 계약이 나오면 함께 고친다.
export const createAdminReservation = (body: ReservationCreateRequest) =>
  apiClient.request<ReservationDetail>(BASE, { method: 'POST', body })

export const reprocessAdminReservation = (reservationId: string) =>
  apiClient.request<ReservationDetail>(`${BASE}/${reservationId}/reprocess`, {
    method: 'POST',
  })

export const forceFinalizeAdminReservation = (reservationId: string) =>
  apiClient.request<ReservationDetail>(
    `${BASE}/${reservationId}/force-finalize`,
    { method: 'POST' },
  )

export const putAdminReservationMemo = (
  reservationId: string,
  memo: string | null,
) =>
  apiClient.request<ReservationDetail>(`${BASE}/${reservationId}/memo`, {
    method: 'PATCH',
    body: { memo },
  })

export const getAdminMembers = (keyword?: string) =>
  apiClient.request<AdminMemberListResponse>(
    `/api/v1/admin/members${keyword ? `?q=${encodeURIComponent(keyword)}` : ''}`,
  )
