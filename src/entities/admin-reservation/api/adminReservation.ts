import { apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type {
  AdminMemberListResponse,
  AdminReservationListParams,
  Paged,
  ReservationSummary,
} from '@shared/api/types'

const BASE = '/api/v1/admin/reservations'

export const getAdminReservations = (
  params: AdminReservationListParams = {},
  signal?: AbortSignal,
) =>
  apiClient.request<Paged<ReservationSummary>>(
    `${BASE}${toQueryString(params)}`,
    {
      signal,
    },
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
