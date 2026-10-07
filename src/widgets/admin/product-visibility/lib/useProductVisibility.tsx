import {
  useHideAdminProduct,
  usePublishAdminProduct,
  type AdminProduct,
} from '@entities/admin-product'
import { useModalStore } from '@shared/model/modalStore'
import { ConfirmDialog } from '@shared/ui'

import { AdminProductHideDialog } from '../ui/AdminProductHideDialog'

/**
 * Tag·버튼을 그리는 데 필요한 최소한만 받는다 — 목록 요약과 상세 둘 다 넘길 수 있게.
 * 필드를 손으로 다시 적지 않고 모델에서 파생시킨다(상세도 같은 두 필드를 갖는다).
 */
export type VisibilityTarget = Pick<AdminProduct, 'productId' | 'name'>

/**
 * 전시 상태를 바꾸는 흐름(확인 모달 → 요청 → 캐시 갱신)을 한곳에 모은다.
 * 목록과 상세가 같은 조치를 서로 다른 자리에서 제공하는데, 양쪽에 따로 적으면
 * 확인 문구나 사유 규칙이 조용히 갈라진다.
 *
 * 화면마다 한 번만 부른다 — 표의 행마다 부르면 mutation 인스턴스가 행 수만큼 생겨
 * 실패 문구를 어디에 띄울지가 애매해진다.
 */
export function useProductVisibility() {
  const openModal = useModalStore((state) => state.open)
  const closeModal = useModalStore((state) => state.close)
  const publish = usePublishAdminProduct()
  const hide = useHideAdminProduct()

  // 지난 실패 문구가 남아 있으면 이번 시도의 결과처럼 보인다.
  const resetBoth = () => {
    publish.reset()
    hide.reset()
  }

  const confirmPublish = (product: VisibilityTarget) => {
    resetBoth()
    openModal(
      <ConfirmDialog
        title="상품을 공개할까요?"
        description={`${product.name}이(가) 구매자 화면에 바로 노출됩니다.`}
        confirmLabel="공개"
        onCancel={closeModal}
        onConfirm={() => {
          closeModal()
          publish.mutate(product.productId)
        }}
      />,
    )
  }

  const confirmHide = (product: VisibilityTarget) => {
    resetBoth()
    openModal(
      <AdminProductHideDialog
        productName={product.name}
        onCancel={closeModal}
        onConfirm={(reason) => {
          closeModal()
          hide.mutate({ productId: product.productId, reason })
        }}
      />,
    )
  }

  return {
    confirmPublish,
    confirmHide,
    // 요청이 도는 동안 버튼을 막는다 — 같은 전환을 두 번 보낼 이유가 없다.
    isPending: publish.isPending || hide.isPending,
    isError: publish.isError || hide.isError,
    error: publish.error ?? hide.error,
  }
}
