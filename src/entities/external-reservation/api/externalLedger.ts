import { ApiRequestError } from '@shared/api/client'
import type { ExternalLedgerPage, ExternalLedgerRow } from '@shared/api/types'

import { requestExternal } from './externalClient'

// 원장 한 쪽 최대 크기(서버 상한 1000)
const PAGE_SIZE = 1000

// [mock] GET /external/reservations — 원장 목록 조회
const getLedgerPage = (cursor: string | null, signal?: AbortSignal) => {
  const query = new URLSearchParams({ size: String(PAGE_SIZE) })
  if (cursor) query.set('cursor', cursor)
  return requestExternal<ExternalLedgerPage>(
    `/external/reservations?${query}`,
    {
      signal,
    },
  )
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
    // 모양이 다르면 끝없이 돌거나 빈 원장으로 보인다 — 실패로 알린다.
    if (!Array.isArray(page.items)) {
      throw new ApiRequestError(
        {
          code: 'INVALID_RESPONSE',
          message: '외부 원장 응답을 처리할 수 없습니다.',
          details: null,
        },
        200,
      )
    }
    rows.push(...page.items)
    cursor = page.nextCursor
  } while (cursor)
  return rows
}
