import axios, { type AxiosResponse } from 'axios'

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
  /**
   * TanStack Query의 queryFn이 넘겨주는 signal. 쿼리 키가 바뀌거나(검색 조건 변경 등)
   * 화면을 떠나면 이전 요청을 취소해서, 늦게 온 옛 응답이 새 화면을 덮지 않게 한다.
   */
  signal?: AbortSignal
}

// 응답이 이 시간 안에 안 오면 끊고 TIMEOUT으로 던진다 — 안 끊으면 로딩이 끝나지 않는다.
const TIMEOUT_MS = 10_000

// 서버가 401 같은 실패도 JSON 봉투로 내려주므로, axios가 비2xx를 reject하지
// 않게 하고 아래에서 envelope의 success로 직접 판단한다.
const http = axios.create({
  withCredentials: true,
  timeout: TIMEOUT_MS,
  validateStatus: () => true,
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 짧은 요청 ID. 서버 제약(영숫자·.·_·-, 64자 이하)을 만족한다.
const requestId = () => crypto.randomUUID().replace(/-/g, '')

type RawResponse<TData> = AxiosResponse<ApiResponse<TData> | string>

// 응답 자체를 못 받은 경우(타임아웃, 네트워크 끊김)도 다른 실패와 같은 ApiRequestError로
// 바꾼다 — status 0이 "서버까지 못 갔다"는 표시다(queryPolicy의 재시도 판단이 이걸 본다).
// 취소는 실패가 아니라서 그대로 던진다(TanStack Query가 알아서 무시한다).
function toTransportError(caught: unknown): unknown {
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

async function send<TData>(
  path: string,
  { body, method = 'GET', headers, signal }: ApiRequestOptions,
): Promise<RawResponse<TData>> {
  try {
    return await http.request<ApiResponse<TData> | string>({
      url: path,
      method,
      data: body,
      signal,
      headers: {
        'X-Request-Id': requestId(),
        ...getAuthHeaders(),
        ...headers,
      },
    })
  } catch (caught) {
    throw toTransportError(caught)
  }
}

// 봉투를 벗겨 data만 돌려주고, 실패는 ApiRequestError로 던진다.
function unwrap<TData>(response: RawResponse<TData>): TData {
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
  throw new ApiRequestError(json.error, response.status)
}

// 401을 받았을 때 같은 요청을 다시 보내도 되는 상태로 만들어 본다. true면 한 번 더 보낸다.
async function recoverFromUnauthorized(
  response: RawResponse<unknown>,
  { skipAuthRefresh }: ApiRequestOptions,
): Promise<boolean> {
  const json = response.data
  if (
    typeof json === 'object' &&
    json !== null &&
    !json.success &&
    json.error.details?.retryable
  ) {
    // 서버 쪽 일시 장애(폐기 조회 실패 등) — 재발급이 아니라 같은 요청을 잠시 후 한 번 더.
    await delay(2000)
    return true
  }
  if (skipAuthRefresh || !onUnauthorized) return false
  return onUnauthorized()
}

async function sendWithRecovery<TData>(
  path: string,
  options: ApiRequestOptions,
): Promise<RawResponse<TData>> {
  const response = await send<TData>(path, options)
  // 401은 딱 한 번만 회복을 시도한다 — 다시 보낸 요청이 또 401이면 그대로 던진다.
  if (
    response.status === 401 &&
    (await recoverFromUnauthorized(response, options))
  ) {
    return send<TData>(path, options)
  }
  return response
}

async function request<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> {
  return unwrap(await sendWithRecovery<TData>(path, options))
}

// 본문 말고 응답 헤더도 봐야 하는 호출용(대기열의 Retry-After 등). 헤더 이름은 소문자로 찾는다.
async function requestWithHeaders<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: TData; headers: Record<string, unknown> }> {
  const response = await sendWithRecovery<TData>(path, options)
  return { data: unwrap(response), headers: { ...response.headers } }
}

export const apiClient = { request, requestWithHeaders }
