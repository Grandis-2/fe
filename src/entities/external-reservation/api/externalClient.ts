import { ApiRequestError } from '@shared/api/client'
import type { ExternalErrorResponse } from '@shared/api/types'

/*
 * 외부 예약 시스템(Mock 서버)은 우리 API(/api)가 아니라 /external 아래다. 개발 서버는 vite
 * 프록시가, 배포는 vercel.json rewrite가 같은 서버로 넘기고, 봉투({ success, data }) 없이 자원을 그대로 주며 실패는
 * { errorCode, errorMessage } 모양이라 apiClient 대신 fetch로 읽는다. 실패는 화면이
 * 다른 API와 같게 다루도록 ApiRequestError로 바꿔 던진다.
 */
const failed = (status: number, message: string, code = 'EXTERNAL_FAILED') =>
  new ApiRequestError({ code, message, details: null }, status)

export async function requestExternal<TData>(
  path: string,
  {
    method = 'GET',
    body,
    signal,
  }: {
    method?: 'GET' | 'PUT' | 'POST'
    body?: unknown
    signal?: AbortSignal
  } = {},
): Promise<TData> {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (caught) {
    // 취소는 실패가 아니다 — apiClient와 같이 그대로 던진다.
    if (signal?.aborted) throw caught
    throw failed(0, '외부 예약 시스템에 연결하지 못했습니다.')
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = data as Partial<ExternalErrorResponse> | null
    throw failed(
      response.status,
      error?.errorMessage ?? '외부 예약 시스템 요청에 실패했습니다.',
      error?.errorCode,
    )
  }
  if (data === null) {
    throw failed(response.status, '외부 예약 시스템 응답을 처리할 수 없습니다.')
  }
  return data as TData
}
