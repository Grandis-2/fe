import {
  isPublicSetting,
  PREORDER_LOCK_LEAD_MS,
  type AdminProductDetailModel,
} from './types'

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
    if (now < Date.parse(campaign.opensAt) - PREORDER_LOCK_LEAD_MS) {
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

/**
 * 접수 조기 마감(POST .../campaign/close)을 할 수 있는지. 접수 중인 회차만 된다 — 오픈
 * 전은 일정 변경으로 마감 시각을 고치고(서버 409), 판매 중지로 회차가 취소됐으면 이미
 * 접수가 끝났다.
 */
export const canClosePreorderEarly = (
  product: Pick<AdminProductDetailModel, 'saleMode' | 'status' | 'campaign'>,
) =>
  product.saleMode === 'PREORDER' &&
  product.campaign?.status === 'OPEN' &&
  product.status === 'ACTIVE'

/**
 * 마감한 접수를 다시 열 수 있는지(POST .../campaign/reopen). 마감된 회차만 되고, 서버가
 * 판매 중이고 공개된 상품만 받는다 — 숨김이면 열 수 있게 할 일을 알린다. 판매 중지로
 * 닫힌 회차(회차 취소)는 다시 열 수 없어 메뉴를 두지 않는다.
 * @returns null(해당 없음) · { ok: true } · { ok: false, reason }
 */
export const reopenPreorderOf = (
  product: Pick<
    AdminProductDetailModel,
    'saleMode' | 'status' | 'campaign' | 'displayStatus'
  >,
): { ok: true } | { ok: false; reason: string } | null => {
  if (
    product.saleMode !== 'PREORDER' ||
    product.campaign?.status !== 'CLOSED' ||
    product.status !== 'ACTIVE'
  )
    return null
  return isPublicSetting(product.displayStatus)
    ? { ok: true }
    : {
        ok: false,
        reason: '숨김 상품은 다시 열 수 없어요. 게시중으로 먼저 전환해 주세요.',
      }
}

/**
 * 상품을 지울 수 있는지(DELETE /admin/products/{id}). 사전예약은 오픈 3분 전부터 마감 전까지
 * 서버가 409로 막는다 — 그 구간이면 이유를 돌려준다. 회차를 취소(판매 중지)했으면 지울 수 있다.
 * 드로우 증정품 여부는 상품 상세로 알 수 없어 서버 409로 알린다.
 * @returns 지울 수 없는 이유. 지울 수 있으면 null
 */
export function deleteBlockedReason(
  product: Pick<AdminProductDetailModel, 'saleMode' | 'status' | 'campaign'>,
  now = Date.now(),
): string | null {
  const { campaign } = product
  if (product.saleMode !== 'PREORDER' || !campaign) return null
  if (campaign.status === 'CLOSED' || product.status !== 'ACTIVE') return null
  if (
    campaign.status === 'OPEN' ||
    now >= Date.parse(campaign.opensAt) - PREORDER_LOCK_LEAD_MS
  )
    return '사전예약 오픈 3분 전부터 마감 전까지는 지울 수 없어요. 판매 중지(회차 취소) 뒤나 마감 뒤에 지워 주세요.'
  return null
}

/**
 * 일반 상품으로 전환할 수 있는지 — 마감된 사전예약 회차만 된다. 회차를 취소(오픈 뒤 판매
 * 중지)했으면 서버가 409로 막아 그 문구를 보인다(상세로는 취소와 오픈 전 중지를 못 가른다).
 */
export const canConvertToInStock = (
  product: Pick<AdminProductDetailModel, 'saleMode' | 'campaign'>,
) => product.saleMode === 'PREORDER' && product.campaign?.status === 'CLOSED'

/** 회차 취소 사유 길이(앞뒤 공백 제외) — 서버가 1~500자만 받는다 */
export const CANCEL_REASON_MAX = 500
