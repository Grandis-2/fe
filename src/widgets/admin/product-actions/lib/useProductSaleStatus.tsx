import {
  useSetAdminProductSaleStatus,
  type AdminProduct,
} from '@entities/admin-product'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'

import { CancelReasonForm } from '../ui/CancelReasonForm'

type SaleTarget = Pick<AdminProduct, 'productId' | 'name'>

/**
 * 판매 상태를 바꾸는 흐름(확인 모달 → 요청 → 캐시 갱신)을 한곳에 모은다.
 * 중지·재개는 되돌릴 수 있어 한 번만 확인하고, 사전예약 오픈 뒤 중지(회차 취소)는
 * 되돌릴 수 없어 결과를 알리고 사유를 받는다.
 */
export function useProductSaleStatus() {
  const saleStatus = useSetAdminProductSaleStatus()

  const run = (
    product: SaleTarget,
    status: 'ACTIVE' | 'PAUSED',
    reason?: string,
  ) => {
    closeModal()
    saleStatus.mutate(
      { productId: product.productId, status, reason },
      {
        onSuccess: ({ campaignCancellationRequested }) =>
          showToast(
            campaignCancellationRequested
              ? '판매를 중지했습니다. 예약 취소는 이어서 처리됩니다.'
              : status === 'PAUSED'
                ? '판매를 중지했습니다.'
                : '판매를 다시 시작했습니다.',
          ),
      },
    )
  }

  // 지난 실패 문구가 남아 있으면 이번 시도의 결과처럼 보인다.
  const open = (content: Parameters<typeof openModal>[0]) => {
    saleStatus.reset()
    openModal({ theme: 'light', ...content })
  }

  return {
    confirmPause: (product: SaleTarget) =>
      open({
        title: '판매를 중지할까요?',
        description: `${product.name}이(가) 구매자 목록에서 빠지고 새 주문을 받지 않습니다.
다시 판매할 수 있고, 기존 주문과 예약은 그대로입니다.`,
        confirmLabel: '판매 중지',
        onConfirm: () => run(product, 'PAUSED'),
      }),
    confirmResume: (product: SaleTarget) =>
      open({
        title: '판매를 다시 시작할까요?',
        description: `${product.name}이(가) 구매자 목록에 다시 나타나고 주문을 받습니다.`,
        confirmLabel: '판매 재개',
        onConfirm: () => run(product, 'ACTIVE'),
      }),
    // 사전예약 오픈 뒤 — 서버가 회차 취소로 처리한다.
    confirmCancel: (product: SaleTarget) =>
      open({
        title: '판매를 중지할까요?',
        description: `이미 받은 예약이 모두 취소되고, 되돌릴 수 없습니다.
${product.name}을(를) 다시 판매할 수 없습니다.`,
        children: (
          <CancelReasonForm
            onConfirm={(reason) => run(product, 'PAUSED', reason)}
            onCancel={closeModal}
          />
        ),
      }),
    isPending: saleStatus.isPending,
    isError: saleStatus.isError,
    error: saleStatus.error,
  }
}
