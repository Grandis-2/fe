import axios, { type AxiosResponse } from 'axios'

import { delay } from '@shared/lib/delay'

import { ApiRequestError, sentRequestId, toTransportError } from './errors'
import { logRequest } from './requestLog'

import type { ApiResponse } from './types'

export { ApiRequestError, getErrorMessage, getTraceId } from './errors'

// shared는 entities를 import할 수 없어서, 인증 헤더/401 처리는 entities/auth가 부팅 시 주입한다.
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

export type ApiRequestOptions = {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  // 재발급 호출 자체처럼, 401이어도 재발급을 부르면 안 되는 요청에 쓴다.
  skipAuthRefresh?: boolean
  // 쿼리 키가 바뀌거나 화면을 떠날 때 이전 요청을 취소한다.
  signal?: AbortSignal
  // 사진 업로드·결제 승인처럼 오래 걸리는 요청만 늘린다. 기본은 TIMEOUT_MS.
  timeout?: number
  // API 도메인으로 직접 부르는 요청은 쿠키가 필요 없다 — false면 CORS가 credentials를
  // 허용하지 않아도 통한다. 인증은 Authorization 헤더로 간다.
  withCredentials?: boolean
}

const TIMEOUT_MS = 10_000

// 서버가 실패도 JSON 봉투로 내려주므로 비2xx를 reject하지 않고 아래에서 success로 판단한다.
const http = axios.create({
  withCredentials: true,
  timeout: TIMEOUT_MS,
  validateStatus: () => true,
})

// 서버 제약(영숫자·.·_·-, 64자 이하)을 만족하는 요청 ID.
const requestId = () => crypto.randomUUID().replace(/-/g, '')

type RawResponse<TData> = AxiosResponse<ApiResponse<TData> | string>

async function send<TData>(
  path: string,
  {
    body,
    method = 'GET',
    headers,
    signal,
    timeout,
    withCredentials,
  }: ApiRequestOptions,
): Promise<RawResponse<TData>> {
  const logged = logRequest({
    method,
    path,
    body,
    idempotencyKey: headers?.['Idempotency-Key'],
  })
  try {
    const response = await http.request<ApiResponse<TData> | string>({
      url: path,
      method,
      data: body,
      signal,
      timeout,
      withCredentials,
      headers: {
        'X-Request-Id': requestId(),
        ...getAuthHeaders(),
        ...headers,
      },
    })
    logged({ status: response.status, retryAfter: retryAfterOf(response) })
    return response
  } catch (caught) {
    const error = toTransportError(caught)
    // 취소는 실패가 아니라 그대로 던져진다(ApiRequestError가 아니다).
    logged({ status: error instanceof ApiRequestError ? error.status : null })
    throw error
  }
}

// 명세는 초 단위로만 준다 — 날짜 형식 등 숫자가 아니면 없는 것으로 본다.
const retryAfterOf = (response: RawResponse<unknown>) => {
  const seconds = Number(response.headers['retry-after'])
  return Number.isFinite(seconds) ? seconds : 0
}

// 봉투를 벗겨 data만 돌려주고, 실패는 ApiRequestError로 던진다.
function unwrap<TData>(response: RawResponse<TData>): TData {
  const headerTraceId: unknown = response.headers['x-request-id']
  const fallbackTraceId =
    typeof headerTraceId === 'string'
      ? headerTraceId
      : sentRequestId(response.config)

  const retryAfterSeconds = retryAfterOf(response)

  // 로그아웃 등 204 No Content는 파싱할 본문이 없다.
  if (response.status === 204) return undefined as TData

  const json = response.data
  // JSON이 아닌 응답(프록시 에러 페이지 등)은 axios가 원문 문자열을 돌려준다.
  if (typeof json !== 'object' || json === null) {
    throw new ApiRequestError(
      {
        code: 'INVALID_RESPONSE',
        message: '서버 응답을 처리할 수 없습니다.',
        details: null,
      },
      response.status,
      fallbackTraceId,
      retryAfterSeconds,
    )
  }
  if (json.success) return json.data
  throw new ApiRequestError(
    json.error,
    response.status,
    json.traceId ?? fallbackTraceId,
    retryAfterSeconds,
  )
}

// 같은 요청을 다시 보내도 되는 상태인지 확인한다. true면 한 번 더 보낸다.
async function canRetry(
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
    // 서버 일시 장애라 재발급 없이 잠시 후 같은 요청을 다시 보낸다.
    await delay(2000)
    return true
  }
  if (skipAuthRefresh || !onUnauthorized) return false
  return onUnauthorized()
}

// 401은 한 번만 회복을 시도한다. 다시 보낸 요청이 또 401이면 그대로 돌려준다.
async function sendWithRecovery<TData>(
  path: string,
  options: ApiRequestOptions,
): Promise<RawResponse<TData>> {
  const response = await send<TData>(path, options)
  if (response.status === 401 && (await canRetry(response, options))) {
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

// 응답 헤더도 필요한 호출용(대기열의 Retry-After 등).
async function requestWithHeaders<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: TData; headers: Record<string, unknown> }> {
  const response = await sendWithRecovery<TData>(path, options)
  return { data: unwrap(response), headers: { ...response.headers } }
}

// SSE 연결(알림 배지 등) — axios는 브라우저에서 이어지는 본문을 못 읽어 fetch로 연다. 열리면 본문 스트림을 주고,
// 연결 전 실패는 다른 API처럼 ApiRequestError로 던진다(401은 재발급 뒤 한 번 다시 연다). 취소는 그대로 던진다.
async function openStream(
  path: string,
  signal: AbortSignal,
  retried = false,
): Promise<ReadableStream<Uint8Array>> {
  const sentId = requestId()
  let response: Response
  try {
    response = await fetch(path, {
      headers: {
        Accept: 'text/event-stream',
        'X-Request-Id': sentId,
        ...getAuthHeaders(),
      },
      credentials: 'include',
      signal,
    })
  } catch (caught) {
    if (signal.aborted) throw caught
    throw new ApiRequestError(
      {
        code: 'NETWORK_ERROR',
        message: '네트워크 연결을 확인해 주세요.',
        details: null,
      },
      0,
      sentId,
    )
  }
  if (response.ok && response.body) return response.body
  if (
    response.status === 401 &&
    !retried &&
    onUnauthorized &&
    (await onUnauthorized())
  )
    return openStream(path, signal, true)

  const json = (await response
    .json()
    .catch(() => null)) as ApiResponse<unknown> | null
  throw new ApiRequestError(
    json && !json.success
      ? json.error
      : {
          code: 'INVALID_RESPONSE',
          message: '서버 응답을 처리할 수 없습니다.',
          details: null,
        },
    response.status,
    json?.traceId ?? response.headers.get('x-request-id') ?? sentId,
  )
}

export const apiClient = { request, requestWithHeaders, openStream }
