import { apiClient } from '@shared/api/client'

import type { Profile, UpdateProfileInput } from '../model/profile'

// 로그인/재발급과 달리 일반 보호 엔드포인트다 — 401이면 재발급 후 재시도한다
// (skipAuthRefresh를 안 준다).
export const getProfile = (signal?: AbortSignal): Promise<Profile> =>
  apiClient.request<Profile>('/api/v1/me/profile', { signal })

// 세 칸을 항상 통째로 보낸다 — 부분 수정 없음.
export const putProfile = (body: UpdateProfileInput): Promise<Profile> =>
  apiClient.request<Profile>('/api/v1/me/profile', {
    method: 'PUT',
    body,
  })
