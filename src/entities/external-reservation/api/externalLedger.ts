import type { ExternalLedgerPage } from '@shared/api/types'

import { requestExternal } from './externalClient'

// [mock] GET /external/reservations — 원장 목록 조회(1건)
/**
 * 원장에 기록이 하나라도 있는지 — 전체를 받지 않고 1건만 본다. 원장 전체 비교는 서버 대조
 * (preorders/reconciliation)가 한다.
 */
export const hasExternalLedgerRows = async (signal?: AbortSignal) =>
  (
    await requestExternal<ExternalLedgerPage>('/external/reservations?size=1', {
      signal,
    })
  ).items.length > 0
