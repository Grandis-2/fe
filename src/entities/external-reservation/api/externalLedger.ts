import { ApiRequestError } from '@shared/api/client'
import type {
  ExternalErrorResponse,
  ExternalLedgerPage,
  ExternalLedgerRow,
} from '@shared/api/types'

// 외부 예약 시스템은 우리 API(/api)가 아니라 /external 아래다. 개발 서버는 vite 프록시가
// Origin을 붙여 넘기고, 응답 봉투가 달라서 apiClient 대신 fetch로 읽는다.
const LEDGER_PATH = '/external/reservations'
// 원장 한 쪽 최대 크기(서버 상한 1000)
const PAGE_SIZE = 1000

const failed = (status: number, message: string, code = 'EXTERNAL_FAILED') =>
  new ApiRequestError({ code, message, details: null }, status)

async function getLedgerPage(cursor: string | null, signal?: AbortSignal) {
  const query = new URLSearchParams({ size: String(PAGE_SIZE) })
  if (cursor) query.set('cursor', cursor)

  let response: Response
  try {
    response = await fetch(`${LEDGER_PATH}?${query}`, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (caught) {
    // 취소는 실패가 아니다 — apiClient와 같이 그대로 던진다.
    if (signal?.aborted) throw caught
    throw failed(0, '외부 예약 시스템에 연결하지 못했습니다.')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = body as Partial<ExternalErrorResponse> | null
    throw failed(
      response.status,
      error?.errorMessage ?? '외부 예약 원장을 불러오지 못했습니다.',
      error?.errorCode,
    )
  }
  if (!body || !Array.isArray((body as ExternalLedgerPage).items)) {
    throw failed(response.status, '외부 원장 응답을 처리할 수 없습니다.')
  }
  return body as ExternalLedgerPage
}

/**
 * 외부 원장 전체를 커서로 끝까지 받는다. 거르기 기능이 없어(모르는 파라미터는 400)
 * 상품별로 보려면 받은 뒤 화면이 거른다.
 */
export async function getExternalLedger(
  signal?: AbortSignal,
): Promise<ExternalLedgerRow[]> {
  const rows: ExternalLedgerRow[] = []
  let cursor: string | null = null
  do {
    const page: ExternalLedgerPage = await getLedgerPage(cursor, signal)
    rows.push(...page.items)
    cursor = page.nextCursor
  } while (cursor)
  return rows
}
