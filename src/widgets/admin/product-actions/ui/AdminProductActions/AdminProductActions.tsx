import {
  canClosePreorderEarly,
  canConvertToInStock,
  deleteBlockedReason,
  reopenPreorderOf,
  isPublicSetting,
  saleStatusActionOf,
  type AdminProductDetailModel,
} from '@entities/admin-product'
import { ActionMenu, type ActionMenuItem } from '@shared/ui'

import type { VisibilityTarget } from '../../lib/useProductVisibility'

type SaleTarget = Pick<AdminProductDetailModel, 'productId' | 'name'>

export type AdminProductActionsProps = {
  product: Pick<
    AdminProductDetailModel,
    | 'productId'
    | 'name'
    | 'displayStatus'
    | 'saleMode'
    | 'status'
    | 'campaign'
    | 'variants'
  >
  onPublish: (product: VisibilityTarget) => void
  onHide: (product: VisibilityTarget) => void
  onPause: (product: SaleTarget) => void
  onResume: (product: SaleTarget) => void
  /** 사전예약 오픈 뒤 판매 중지 — 회차 취소라 사유를 받는다 */
  onCancel: (product: SaleTarget) => void
  /** 사전예약 접수 조기 마감 — 받은 예약은 남기고 새 접수만 막는다 */
  onCloseEarly: (product: SaleTarget) => void
  /** 마감한 접수 다시 열기 — 새 마감 시각을 받는다 */
  onReopen: (product: SaleTarget) => void
  /** 상품 삭제 — 되돌릴 수 없어 이름을 입력받는다 */
  onDelete: (product: SaleTarget) => void
  /** 마감한 사전예약을 일반 상품으로 — 옵션마다 처음 재고를 받는다 */
  onConvert: (
    product: SaleTarget & Pick<AdminProductDetailModel, 'variants'>,
  ) => void
  /** 전환 요청이 도는 중 — 같은 전환을 두 번 보내지 않게 메뉴를 막는다 */
  pending?: boolean
  className?: string
}

/**
 * 상품 상태를 바꾸는 ⋮ 메뉴 — 공개 전환, 접수 조기 마감, 판매 중지. 둘 다 누르면 바로 반영되는 동작이라
 * 수정 폼(저장해야 반영)과 섞지 않고 제목 줄에 둔다. 상태는 옆 태그가 보여주므로 메뉴는
 * 다음 상태로 가는 길만 연다.
 *
 * 문구에 도착할 상태를 적는다(숨김으로 전환하기) — 지금 상태인지 누르면 그렇게 되는지
 * 헷갈리지 않게.
 */
export function AdminProductActions({
  product,
  onPublish,
  onHide,
  onPause,
  onResume,
  onCancel,
  onCloseEarly,
  onReopen,
  onDelete,
  onConvert,
  pending = false,
  className,
}: AdminProductActionsProps) {
  // 공개 예정·공개 종료도 공개 설정은 켜져 있다 — 접수 기간 밖이라 안 보일 뿐이다.
  const visibilityItem: ActionMenuItem = isPublicSetting(product.displayStatus)
    ? { label: '숨김으로 전환하기', onSelect: () => onHide(product) }
    : { label: '게시중으로 전환하기', onSelect: () => onPublish(product) }

  const action = saleStatusActionOf(product)
  const saleItem: ActionMenuItem | null =
    action === null
      ? null
      : action.kind === 'pause'
        ? { label: '판매 중지하기', onSelect: () => onPause(product) }
        : action.kind === 'resume'
          ? { label: '판매 재개하기', onSelect: () => onResume(product) }
          : action.kind === 'cancel'
            ? {
                label: '판매 중지하기',
                danger: true,
                onSelect: () => onCancel(product),
              }
            : {
                // 잠금 구간에도 지금 상태 기준으로 적는다 — 이미 중지면 '재개'다.
                label:
                  product.status === 'ACTIVE'
                    ? '판매 중지하기'
                    : '판매 재개하기',
                disabledReason: action.reason,
                onSelect: () => undefined,
              }

  // 판매 중지(회차 취소) 바로 위에 둬서, 예약을 남기는 길과 없애는 길을 나란히 고르게 한다.
  const closeItem: ActionMenuItem | null = canClosePreorderEarly(product)
    ? { label: '접수 조기 마감하기', onSelect: () => onCloseEarly(product) }
    : null

  // 마감한 회차만 — 숨김이면 서버가 받지 않아 이유를 적고 막는다.
  const reopen = reopenPreorderOf(product)
  const reopenItem: ActionMenuItem | null = reopen && {
    label: '접수 다시 열기',
    disabledReason: reopen.ok ? undefined : reopen.reason,
    onSelect: () => (reopen.ok ? onReopen(product) : undefined),
  }

  const convertItem: ActionMenuItem | null = canConvertToInStock(product)
    ? { label: '일반 상품으로 전환', onSelect: () => onConvert(product) }
    : null

  // 되돌릴 수 없어 맨 아래 빨갛게 둔다. 접수 중인 사전예약은 서버가 막아 이유를 적는다.
  const blocked = deleteBlockedReason(product)
  const deleteItem: ActionMenuItem = {
    label: '상품 삭제',
    danger: true,
    disabledReason: blocked ?? undefined,
    onSelect: () => (blocked ? undefined : onDelete(product)),
  }

  const items = [
    visibilityItem,
    closeItem,
    reopenItem,
    convertItem,
    saleItem,
    deleteItem,
  ].filter((item): item is ActionMenuItem => item !== null)

  return (
    <ActionMenu
      className={className}
      label={`${product.name} 관리 메뉴`}
      disabled={pending}
      items={items}
    />
  )
}
