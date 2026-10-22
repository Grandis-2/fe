import {
  isReprocessable,
  type AdminReservation,
} from '@entities/admin-reservation'
import type { ExternalReservation } from '@entities/external-reservation'

/**
 * 어긋남의 종류.
 * - MISSING: 우리는 등록·확정됐는데 외부에 등록이 없거나 취소돼 있다
 * - ORPHAN: 외부엔 등록돼 있는데 우리 예약이 없다(관리자 API로는 끌 수 없다)
 * - CANCEL_MISSED: 우리는 취소했는데 외부엔 아직 등록돼 있다(외부 취소 실패)
 * - MISMATCH: 양쪽에 다 있는데 상품·회원이 다르다
 * - STALE: 우리가 외부 등록을 오래 기다리고 있다. 외부엔 이미 등록된 '응답 유실'도
 *   여기다 — 같은 키로 다시 보내면 외부가 그 등록을 돌려줘서 재처리로 풀린다
 */
export type ReconcileKind =
  'MISSING' | 'ORPHAN' | 'CANCEL_MISSED' | 'MISMATCH' | 'STALE'

export type ReconcileIssue = {
  /** 예약 id(= 외부 키) */
  key: string
  kind: ReconcileKind
  productId: string | null
  reservation?: AdminReservation
  external?: ExternalReservation
  /** 무엇이 어긋났는지 한 줄 설명 */
  reason: string
}

/**
 * 접수 직후에는 외부 등록이 아직 안 끝났거나 우리가 응답을 반영하기 전이라 정상인데도
 * 어긋나 보인다. 이 시간 안의 건은 문제로 세지 않는다.
 */
export const RECONCILE_GRACE_MS = 60_000

const STATUS_TEXT: Record<AdminReservation['status'], string> = {
  PENDING_SYNC: '처리 중',
  REGISTERED: '결제 대기',
  RESERVED: '예약 확정',
  CANCELING: '취소 중',
  CANCELED: '취소',
}

/**
 * 우리 예약과 외부 원장을 예약 id(외부 키)로 맞춰 어긋난 건만 돌려준다. 두 목록은 같은
 * 시점에 받은 것이어야 한다 — 받는 사이에 바뀐 건은 다음 대조에서 다시 본다.
 */
export function reconcile(
  reservations: AdminReservation[],
  ledger: ExternalReservation[],
  now = Date.now(),
): ReconcileIssue[] {
  const ledgerByKey = new Map(ledger.map((row) => [row.externalKey, row]))
  const ourKeys = new Set(reservations.map((item) => item.preorderId))
  const settled = (iso: string | null) =>
    iso !== null && now - Date.parse(iso) >= RECONCILE_GRACE_MS
  const issues: ReconcileIssue[] = []

  for (const reservation of reservations) {
    const external = ledgerByKey.get(reservation.preorderId)
    const active = external?.status === 'ACTIVE'
    const base = {
      key: reservation.preorderId,
      productId: reservation.productId,
      reservation,
      external,
    }
    const ours = STATUS_TEXT[reservation.status]

    switch (reservation.status) {
      case 'REGISTERED':
      case 'RESERVED':
        if (!active) {
          issues.push({
            ...base,
            kind: 'MISSING',
            reason: external
              ? `우리는 ${ours}인데 외부 예약 시스템에서는 취소돼 있습니다.`
              : `우리는 ${ours}인데 외부 예약 시스템에 예약이 없습니다.`,
          })
        } else if (
          external.productId !== reservation.productId ||
          external.customerId !== reservation.customerId
        ) {
          issues.push({
            ...base,
            kind: 'MISMATCH',
            reason:
              external.productId !== reservation.productId
                ? '외부 예약 시스템에 다른 상품으로 등록돼 있습니다.'
                : '외부 예약 시스템에 다른 회원으로 등록돼 있습니다.',
          })
        }
        break
      case 'PENDING_SYNC':
        if (!settled(reservation.createdAt)) break
        issues.push({
          ...base,
          kind: 'STALE',
          reason: active
            ? '외부에는 등록됐지만 아직 우리 쪽에 반영되지 않았습니다.'
            : isReprocessable(reservation)
              ? '자동 등록에 실패했습니다. 재처리를 눌러 다시 시도해 주세요.'
              : '외부 등록을 자동으로 다시 시도하고 있습니다.',
        })
        break
      case 'CANCELED':
        if (active && settled(reservation.createdAt)) {
          issues.push({
            ...base,
            kind: 'CANCEL_MISSED',
            reason: '우리는 취소했는데 외부에는 아직 예약이 남아 있습니다.',
          })
        }
        break
      // 취소 중은 외부 취소가 진행 중이라 어긋나 보이는 게 정상이다.
      case 'CANCELING':
        break
    }
  }

  for (const external of ledger) {
    if (
      external.status === 'ACTIVE' &&
      !ourKeys.has(external.externalKey) &&
      settled(external.confirmedAt)
    ) {
      issues.push({
        key: external.externalKey,
        kind: 'ORPHAN',
        productId: external.productId,
        external,
        reason: '우리 예약 목록에 없는 예약입니다.',
      })
    }
  }
  return issues
}

/**
 * 지금 API로 고칠 수 있는 건 — 외부 등록이 재처리 대기(DEAD_LETTER)인 처리 중 예약뿐이다.
 * 취소 중·취소된 예약은 서버가 409로 거절한다.
 */
export const canReprocess = (issue: ReconcileIssue) =>
  issue.reservation?.status === 'PENDING_SYNC' &&
  isReprocessable(issue.reservation)

// 일반 관리자가 보는 이름이라 시스템 용어(원장·유실 등) 없이 상황만 말한다.
export const reconcileKindLabel: Record<ReconcileKind, string> = {
  MISSING: '외부 예약 없음',
  ORPHAN: '외부에만 있음',
  CANCEL_MISSED: '외부 취소 안 됨',
  MISMATCH: '정보 다름',
  STALE: '등록 지연',
}

export const reconcileKindDescription: Record<ReconcileKind, string> = {
  MISSING: '우리는 확정했는데 외부 예약 시스템에 예약이 없습니다.',
  ORPHAN: '외부 예약 시스템에만 있고 우리에게는 없는 예약입니다.',
  CANCEL_MISSED: '우리는 취소했는데 외부에는 아직 예약이 남아 있습니다.',
  MISMATCH: '양쪽 예약의 회원이나 상품이 다릅니다.',
  STALE:
    '접수 뒤 외부 등록이 오래 끝나지 않고 있습니다. 재처리 버튼이 있는 건만 직접 다시 시도할 수 있습니다.',
}

// 두 단계로만 나눈다 — 사람이 확인할 것(빨강)과 기다리면 풀리는 것(회색). 유형은 태그
// 글자로 읽는다. 남색 테두리는 같은 줄의 재처리 버튼과 모양이 겹쳐 쓰지 않는다.
export const reconcileKindColor: Record<ReconcileKind, 'red' | 'gray'> = {
  MISSING: 'red',
  ORPHAN: 'red',
  CANCEL_MISSED: 'red',
  MISMATCH: 'red',
  STALE: 'gray',
}

/** 양쪽 상태 칸에서 어느 쪽이 어긋났는지 — 그쪽 글씨를 강조한다 */
export const reconcileWrongSide: Record<
  ReconcileKind,
  'ours' | 'external' | null
> = {
  MISSING: 'external',
  ORPHAN: 'ours',
  CANCEL_MISSED: 'external',
  MISMATCH: 'external',
  STALE: null,
}

// 객체 키 순서가 탭 순서다 — 예약이 사라질 수 있는 것부터.
export const reconcileKinds = Object.keys(reconcileKindLabel) as ReconcileKind[]
