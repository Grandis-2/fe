import { HttpResponse } from 'msw'

import type { ApiError, ApiResponse, ApiViolation } from '../types'

const envelope = () => ({
  timestamp: new Date().toISOString(),
  traceId: crypto.randomUUID(),
})

export function ok<TData>(data: TData, status = 200) {
  return HttpResponse.json<ApiResponse<TData>>(
    { success: true, data, error: null, ...envelope() },
    { status },
  )
}

// violations/retryable은 호출부에 평평하게 받는다 — 호출부가 매번 details 객체를
// 조립할 필요는 없다. 실제 서버 봉투 모양(error.details 중첩)은 여기서만 조립한다.
export function fail(
  status: number,
  error: Pick<ApiError, 'code' | 'message'> & {
    violations?: ApiViolation[]
    retryable?: boolean
  },
) {
  const { code, message, violations, retryable } = error
  const details =
    violations || retryable !== undefined ? { violations, retryable } : null

  return HttpResponse.json<ApiResponse<never>>(
    {
      success: false,
      data: null,
      error: { code, message, details },
      ...envelope(),
    },
    { status },
  )
}

// 400 VALIDATION_FAILED — 문제 필드는 violations[].field로 알린다(쿼리·경로 파라미터 이름, 본문 전체는 'body').
export const invalid = (violations: ApiViolation[]) =>
  fail(400, {
    code: 'VALIDATION_FAILED',
    message: '요청 값이 올바르지 않습니다.',
    violations,
  })
