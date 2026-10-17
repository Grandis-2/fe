import {
  useSetAdminProductVisibility,
  type AdminProduct,
} from '@entities/admin-product'
import { closeModal, openModal } from '@shared/model/modalStore'

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
  const visibility = useSetAdminProductVisibility()

  // 둘 다 되돌릴 수 있는 전환이라(명세: 숨겼다 다시 공개하면 다시 나타난다) 사유는
  // 받지 않고 한 번만 확인한다. 사유가 필요한 건 판매 중지(회차 취소) 쪽이다.
  const confirm = (
    product: VisibilityTarget,
    visible: boolean,
    copy: { title: string; description: string; confirmLabel: string },
  ) => {
    // 지난 실패 문구가 남아 있으면 이번 시도의 결과처럼 보인다.
    visibility.reset()
    openModal({
      theme: 'light',
      ...copy,
      onConfirm: () => {
        closeModal()
        visibility.mutate({ productId: product.productId, visible })
      },
    })
  }

  return {
    confirmPublish: (product: VisibilityTarget) =>
      confirm(product, true, {
        title: '상품을 공개할까요?',
        description: `${product.name}이(가) 구매자 화면에 바로 노출됩니다.`,
        confirmLabel: '공개',
      }),
    confirmHide: (product: VisibilityTarget) =>
      confirm(product, false, {
        title: '상품을 숨길까요?',
        description: `${product.name}이(가) 구매자 화면에서 사라집니다.
다시 공개할 수 있고, 기존 주문과 예약은 그대로입니다.`,
        confirmLabel: '숨기기',
      }),
    // 요청이 도는 동안 버튼을 막는다 — 같은 전환을 두 번 보낼 이유가 없다.
    isPending: visibility.isPending,
    isError: visibility.isError,
    error: visibility.error,
  }
}
