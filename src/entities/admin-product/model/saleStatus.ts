import type { AdminProductDetailModel } from './types'

/** 서버가 오픈 직전 판매 상태 변경을 막는 구간(오픈 3분 전부터) */
const LOCK_LEAD_MS = 3 * 60 * 1000

/**
 * 지금 이 상품에 할 수 있는 판매 상태 동작. 서버 규칙(PATCH .../sale-status)을 그대로
 * 옮긴다 — 화면이 막지 않으면 관리자가 눌러 보고 400·409를 받아야 안다.
 *
 * - pause: 판매 중지(되돌릴 수 있다)
 * - resume: 판매 재개
 * - cancel: 사전예약 오픈 뒤 판매 중지 — 회차 취소라 받은 예약이 모두 취소되고 되돌릴
 *   수 없다. 사유가 필수다
 * - locked: 지금은 바꿀 수 없다(reason에 이유)
 * - null: 할 수 있는 게 없다(오픈 뒤 이미 중지 — 다시 판매할 수 없다)
 */
export type SaleStatusAction =
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'cancel' }
  | { kind: 'locked'; reason: string }

export function saleStatusActionOf(
  product: Pick<AdminProductDetailModel, 'saleMode' | 'status' | 'campaign'>,
  now = Date.now(),
): SaleStatusAction | null {
  const { status, campaign } = product
  // 일반 상품, 그리고 회차가 아직 없는(준비 중) 사전예약은 언제든 켜고 끈다.
  if (product.saleMode !== 'PREORDER' || !campaign) {
    return { kind: status === 'ACTIVE' ? 'pause' : 'resume' }
  }

  if (campaign.status === 'BEFORE_OPEN') {
    if (now < Date.parse(campaign.opensAt) - LOCK_LEAD_MS) {
      return { kind: status === 'ACTIVE' ? 'pause' : 'resume' }
    }
    return {
      kind: 'locked',
      reason: '오픈 3분 전부터 오픈까지는 판매 상태를 바꿀 수 없습니다.',
    }
  }

  // 오픈 뒤: 판매 중이면 중지가 곧 회차 취소다. 이미 중지면 다시 판매할 수 없다(409).
  return status === 'ACTIVE' ? { kind: 'cancel' } : null
}

/** 회차 취소 사유 길이(앞뒤 공백 제외) — 서버가 1~500자만 받는다 */
export const CANCEL_REASON_MAX = 500
