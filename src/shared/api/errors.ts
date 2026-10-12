import axios from 'axios'

import type { ApiError } from './types'

export class ApiRequestError extends Error {
  readonly error: ApiError
  readonly status: number

  constructor(error: ApiError, status: number) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.error = error
    this.status = status
  }
}

// 서버 메시지가 있으면 그것을, 없으면(네트워크 오류 등) 호출부의 기본 문구를 쓴다.
export const getErrorMessage = (caught: unknown, fallback: string) =>
  caught instanceof ApiRequestError ? caught.error.message : fallback

// 응답을 못 받은 경우(타임아웃, 끊김)를 ApiRequestError(status 0)로 바꾼다. 취소는 그대로 던진다.
export function toTransportError(caught: unknown): unknown {
  if (axios.isCancel(caught) || !axios.isAxiosError(caught)) return caught
  const timedOut = caught.code === 'ECONNABORTED' || caught.code === 'ETIMEDOUT'
  return new ApiRequestError(
    timedOut
      ? {
          code: 'TIMEOUT',
          message: '서버 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.',
          details: null,
        }
      : {
          code: 'NETWORK_ERROR',
          message: '네트워크 연결을 확인해 주세요.',
          details: null,
        },
    0,
  )
}
