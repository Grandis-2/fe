import axios from 'axios'

import type { ApiError, ApiResponse } from './types'

// shared는 entities를 import할 수 없어서(FSD 경계), 인증 헤더/401 처리를
// entities/auth가 부팅 시 주입한다. 주입 전에는 빈 동작으로 둬서 인증이
// 필요 없는 엔드포인트(상품 조회 등)는 그대로 동작한다.
let getAuthHeaders: () => Record<string, string> = () => ({})
// true를 돌려주면 원 요청을 한 번 재시도한다(재발급 성공 시).
let onUnauthorized: (() => Promise<boolean>) | null = null

export function configureApiAuth(config: {
  getAuthHeaders?: () => Record<string, string>
  onUnauthorized?: () => Promise<boolean>
}) {
  if (config.getAuthHeaders) getAuthHeaders = config.getAuthHeaders
  if (config.onUnauthorized) onUnauthorized = config.onUnauthorized
}

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

// 화면에 보여줄 에러 문구 — 서버가 내려준 메시지가 있으면 그것을, 아니면(네트워크 오류 등)
// 호출부의 기본 문구를 쓴다.
export const getErrorMessage = (caught: unknown, fallback: string) =>
  caught instanceof ApiRequestError ? caught.error.message : fallback

export type ApiRequestOptions = {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  /**
   * 401을 받아도 재발급을 트리거하지 않는다 — /session/refresh, /admin/session처럼
   * 그 자체가 인증 흐름인 호출에 쓴다. 안 그러면 재발급 실패가 또 재발급을 부른다.
   */
  skipAuthRefresh?: boolean
}

// 서버가 401 같은 실패도 JSON 봉투로 내려주므로, axios가 비2xx를 reject하지
// 않게 하고 아래에서 envelope의 success로 직접 판단한다.
const http = axios.create({ withCredentials: true, validateStatus: () => true })

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 짧은 요청 ID. 서버 제약(영숫자·.·_·-, 64자 이하)을 만족한다.
const requestId = () => crypto.randomUUID().replace(/-/g, '')

async function request<TData>(
  path: string,
  options: ApiRequestOptions = {},
  attempted = false,
): Promise<TData> {
  const { body, skipAuthRefresh, method = 'GET', headers } = options

  const response = await http.request<ApiResponse<TData> | string>({
    url: path,
    method,
    data: body,
    headers: {
      'X-Request-Id': requestId(),
      ...getAuthHeaders(),
      ...headers,
    },
  })

  // 로그아웃 등 204 No Content는 파싱할 본문이 없다.
  if (response.status === 204) return undefined as TData

  const json = response.data
  // 응답 본문이 JSON 객체가 아니면(프록시 에러 페이지 등) 나머지 호출부와
  // 같은 ApiRequestError로 감싼다 — axios는 파싱 실패 시 원문 문자열을 돌려준다.
  if (typeof json !== 'object' || json === null) {
    throw new ApiRequestError(
      {
        code: 'INVALID_RESPONSE',
        message: '서버 응답을 처리할 수 없습니다.',
        details: null,
      },
      response.status,
    )
  }
  if (json.success) return json.data

  const { error } = json

  // 재시도는 최초 1회만 — 재시도한 요청이 또 401이면 그대로 던진다.
  if (response.status === 401 && !attempted) {
    if (error.details?.retryable) {
      // 서버 쪽 일시 장애(폐기 조회 실패 등) — 재발급이 아니라 같은 요청을 잠시 후 한 번 더.
      await delay(2000)
      return request<TData>(path, options, true)
    }
    if (!skipAuthRefresh && onUnauthorized) {
      const shouldRetry = await onUnauthorized()
      if (shouldRetry) return request<TData>(path, options, true)
    }
  }

  throw new ApiRequestError(error, response.status)
}

export const apiClient = { request }
