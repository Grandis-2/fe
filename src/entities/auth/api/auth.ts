import { apiClient } from '@shared/api/client'
import type {
  AdminLoginRequest,
  AdminSessionResponse,
  KakaoCallbackRequest,
  Session,
  SessionInfo,
} from '@shared/api/types'

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

/**
 * 로그아웃. 503이면 서버 정리가 덜 끝나므로 잠시 뒤 한 번 더 보내는데, 그때는 이미
 * 세션 스토어를 비운 뒤라 토큰이 자동으로 실리지 않는다 — 그 경우에만 직접 넘긴다.
 */
export const deleteSession = (sessionToken?: string) =>
  apiClient.request<void>('/api/v1/session', {
    method: 'DELETE',
    skipAuthRefresh: true,
    headers: sessionToken
      ? { Authorization: `Bearer ${sessionToken}` }
      : undefined,
  })

export const postAdminSession = (body: AdminLoginRequest) =>
  apiClient.request<AdminSessionResponse>('/api/v1/admin/session', {
    method: 'POST',
    body,
    skipAuthRefresh: true,
  })
