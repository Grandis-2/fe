import { useNavigate } from 'react-router'

import {
  useDeleteAdminProduct,
  type AdminProduct,
} from '@entities/admin-product'
import { ADMIN_PRODUCTS_PATH } from '@shared/config/routes'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'

import { DeleteProductForm } from '../ui/DeleteProductForm'

type DeleteTarget = Pick<AdminProduct, 'productId' | 'name'>

/**
 * 상품 삭제 — 되돌릴 수 없어 이름을 입력받아 확인하고, 지우면 상세가 404라 목록으로 간다.
 * 접수 중인 사전예약·진행 중인 드로우 증정품은 서버가 409로 막는다(문구는 화면이 띄운다).
 */
export function useProductDelete() {
  const navigate = useNavigate()
  const remove = useDeleteAdminProduct()

  return {
    confirmDelete: (product: DeleteTarget) => {
      remove.reset()
      openModal({
        theme: 'light',
        title: '상품을 지울까요?',
        description: `${product.name}이(가) 관리자·회원 목록과 상세에서 모두 빠지고 되돌릴 수 없습니다.
묶여 있던 홍보에서도 빠지고, 상품 사진은 상품에서 떨어집니다.`,
        children: (
          <DeleteProductForm
            name={product.name}
            onConfirm={() => {
              closeModal()
              remove.mutate(product.productId, {
                onSuccess: () => {
                  showToast(`${product.name}을(를) 지웠습니다.`)
                  void navigate(ADMIN_PRODUCTS_PATH)
                },
              })
            }}
            onCancel={closeModal}
          />
        ),
      })
    },
    isPending: remove.isPending,
    isError: remove.isError,
    error: remove.error,
  }
}
