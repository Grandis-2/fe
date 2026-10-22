import { ApiRequestError, getErrorMessage } from '@shared/api/client'

import { adminOrderStatusLabel, type AdminOrderStatus } from '../model/types'

/**
 * 배송 단계 요청 한 건의 결과.
 * - moved: 이번에 옮김 / already: 이미 그 단계(다른 관리자가 먼저 옮김 — 성공으로 센다)
 * - rejected: 옮길 수 없음(409 등 4xx) — 다시 보내도 같다
 * - unknown: 응답을 못 받음(네트워크·5xx) — 같은 요청은 두 번 반영되지 않아 다시 보내도 된다
 */
export type ShippingOutcome =
  | { kind: 'moved' }
  | { kind: 'already' }
  | { kind: 'rejected'; reason: string }
  | { kind: 'unknown' }

const isOrderStatus = (value: unknown): value is AdminOrderStatus =>
  typeof value === 'string' && Object.hasOwn(adminOrderStatusLabel, value)

/** 실패한 요청을 결과로 바꾼다. 409면 서버가 알려 준 지금 상태로 말한다 */
export function failedShippingOutcome(caught: unknown): ShippingOutcome {
  if (
    !(caught instanceof ApiRequestError) ||
    caught.status === 0 ||
    caught.status >= 500
  )
    return { kind: 'unknown' }
  if (caught.error.code === 'ORDER_STEP_NOT_ALLOWED') {
    const current = caught.error.details?.status
    return {
      kind: 'rejected',
      reason: isOrderStatus(current)
        ? `지금 '${adminOrderStatusLabel[current]}'`
        : '지금 상태에서 옮길 수 없음',
    }
  }
  return {
    kind: 'rejected',
    reason: getErrorMessage(caught, '옮기지 못함'),
  }
}
