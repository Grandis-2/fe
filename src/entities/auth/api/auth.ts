import { apiClient } from '@/shared/api/client'
import type {
  AdminLoginRequest,
  KakaoCallbackRequest,
  Session,
  SessionInfo,
} from '@/shared/api/types'

// 로그인 API에는 Idempotency-Key가 필요 없다(11-frontend-guide.md §2).
export const postKakaoCallback = (body: KakaoCallbackRequest) =>
  apiClient.request<Session>('/api/v1/auth/kakao/callback', {
    method: 'POST',
    body,
    skipAuthRefresh: true,
  })

export const refreshSession = () =>
  apiClient.request<Session>('/api/v1/session/refresh', {
    method: 'POST',
    skipAuthRefresh: true,
  })

export const getSession = () =>
  apiClient.request<SessionInfo>('/api/v1/session', { skipAuthRefresh: true })

export const deleteSession = () =>
  apiClient.request<void>('/api/v1/session', {
    method: 'DELETE',
    skipAuthRefresh: true,
  })

export const postAdminSession = (body: AdminLoginRequest) =>
  apiClient.request<Session>('/api/v1/admin/session', {
    method: 'POST',
    body,
    skipAuthRefresh: true,
  })
