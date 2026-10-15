import { HttpResponse, http } from 'msw'

import { reservationStore } from '../fixtures/admin-reservation'
import { url } from '../url'

import type {
  ExternalErrorResponse,
  ExternalLedgerPage,
  ExternalLedgerRow,
} from '../../types'
import type { RequestHandler } from 'msw'

/*
 * 외부 예약 시스템(Mock 서버) 원장 목업. 우리 예약 목에서 만들되, 대조 화면에서 종류별
 * 어긋남이 하나씩 보이도록 일부러 틀어 둔다 — 실서버에서는 이런 건이 없어야 정상이다.
 */
const ORPHAN_KEY = '0f0e0d0c-4a5b-4c7d-8e9f-00000000dead'

// 성공·실패 응답 모양이 달라 핸들러의 응답 타입을 합쳐 둔다.
type LedgerResponse = ExternalLedgerPage | ExternalErrorResponse

const invalid = (message: string) =>
  HttpResponse.json<LedgerResponse>(
    { errorCode: 'INVALID_REQUEST', errorMessage: message },
    { status: 400 },
  )

function buildLedger(): ExternalLedgerRow[] {
  const registered = reservationStore.filter(
    (item) => item.status === 'REGISTERED' || item.status === 'RESERVED',
  )
  // 누락: 확정된 예약 하나는 외부에 없다.
  const missing = registered[0]?.preorderId
  // 불일치: 다른 회원으로 등록돼 있다.
  const mismatched = registered[1]?.preorderId
  // 응답 유실: 우리는 아직 처리 중인데 외부는 등록을 마쳤다.
  const lostResponse = reservationStore.find(
    (item) => item.status === 'PENDING_SYNC',
  )?.preorderId
  // 취소 미반영: 우리는 취소를 마쳤는데 외부 취소가 닿지 않아 아직 등록돼 있다.
  const cancelMissed = reservationStore.find(
    (item) => item.status === 'CANCELED',
  )?.preorderId

  const rows: ExternalLedgerRow[] = reservationStore.flatMap((item) => {
    const row: ExternalLedgerRow = {
      externalKey: item.preorderId,
      externalNumber: item.externalReference,
      customerId: item.customerId,
      productId: item.productId,
      sku: item.optionTitle,
      status: 'ACTIVE',
      confirmedAt: item.payableFrom,
      canceledAt: null,
    }
    if (item.preorderId === lostResponse) {
      return [
        { ...row, externalNumber: 'R-LOST-0001', confirmedAt: item.createdAt },
      ]
    }
    if (item.preorderId === missing || item.status === 'PENDING_SYNC') {
      return []
    }
    if (item.preorderId === cancelMissed) return [row]
    if (item.status === 'CANCELED' || item.status === 'CANCELING') {
      return [{ ...row, status: 'CANCELED', canceledAt: item.createdAt }]
    }
    if (item.preorderId === mismatched) {
      return [{ ...row, customerId: '5d1c2e3f-4a5b-4c6d-8e7f-00000000ffff' }]
    }
    return [row]
  })

  // 유령: 우리 예약에 없는 등록.
  const sample = registered[2]
  if (sample) {
    rows.push({
      externalKey: ORPHAN_KEY,
      externalNumber: 'R-ORPHAN-0001',
      customerId: sample.customerId,
      productId: sample.productId,
      sku: sample.optionTitle,
      status: 'ACTIVE',
      confirmedAt: sample.createdAt,
      canceledAt: null,
    })
  }
  return rows.toSorted((a, b) => a.externalKey.localeCompare(b.externalKey))
}

export const externalReservationHandlers: RequestHandler[] = [
  // 외부 키 순서로 커서 페이지를 준다. 모르는 파라미터는 400(실서버와 같다).
  http.get(url('/external/reservations'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const unknown = [...query.keys()].find(
      (key) => key !== 'cursor' && key !== 'size',
    )
    if (unknown) return invalid(`알 수 없는 파라미터입니다: ${unknown}`)
    const size = Number(query.get('size') ?? 500)
    if (!Number.isInteger(size) || size < 1 || size > 1000) {
      return invalid('size 는 1~1000 정수입니다.')
    }

    const cursor = query.get('cursor')
    const rest = buildLedger().filter(
      (row) => !cursor || row.externalKey > cursor,
    )
    const items = rest.slice(0, size)
    return HttpResponse.json<LedgerResponse>({
      items,
      nextCursor:
        rest.length > size ? items[items.length - 1].externalKey : null,
    })
  }),
]
