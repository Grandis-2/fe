import axios from 'axios'

import type { ApiError } from './types'

export class ApiRequestError extends Error {
  readonly error: ApiError
  readonly status: number
  // 문의·버그 신고 때 서버 로그를 찾는 추적 ID — 봉투의 traceId, 없으면 응답 헤더 X-Request-Id,
  // 응답을 못 받았으면(타임아웃 등) 우리가 보낸 X-Request-Id.
  readonly traceId: string | null
  // 실패 응답의 Retry-After(초). 503 등에서 서버가 다시 보낼 때까지 기다리라고 한 시간이다.
  // 헤더가 없거나 숫자가 아니면 0.
  readonly retryAfter: number

  constructor(
    error: ApiError,
    status: number,
    traceId: string | null = null,
    retryAfter = 0,
  ) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.error = error
    this.status = status
    this.traceId = traceId
    this.retryAfter = retryAfter
  }
}

// 서버 메시지가 있으면 그것을, 없으면(네트워크 오류 등) 호출부의 기본 문구를 쓴다.
export const getErrorMessage = (caught: unknown, fallback: string) =>
  caught instanceof ApiRequestError ? caught.error.message : fallback

// 에러 화면에 "문의 코드"로 보여줄 추적 ID. API 실패가 아니면(렌더링 오류 등) null.
export const getTraceId = (caught: unknown) =>
  caught instanceof ApiRequestError ? caught.traceId : null

// 요청에 실어 보낸 X-Request-Id — 서버는 이 값을 그대로 traceId로 이어 쓴다.
export const sentRequestId = (config: { headers?: unknown } | undefined) => {
  const value = (config?.headers as Record<string, unknown> | undefined)?.[
    'X-Request-Id'
  ]
  return typeof value === 'string' ? value : null
}

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
    sentRequestId(caught.config),
  )
}
