import { useAddCartItem } from '@entities/cart'
import { getErrorMessage } from '@shared/api/client'
import { showToast } from '@shared/model/toastStore'

// 상품 상세의 장바구니 담기. 같은 옵션을 다시 담으면 서버가 수량을 더한다.
// 같은 요청을 다시 보내면 또 더해지므로 진행 중엔 무시하고, 실패는 서버 문구(재고 부족·판매 중지 등)를 보여 준다.
// ponytail: 상세에 보증 선택 UI가 없어 보증 없이 담는다 — 보증을 고르게 되면 warranty를 함께 보낸다.
export function useAddToCart() {
  const add = useAddCartItem()

  const addToCart = (variantId: string, quantity: number) => {
    if (add.isPending) return
    add.mutate(
      { variantId, quantity },
      {
        onSuccess: () => showToast('장바구니에 담았어요.'),
        onError: (caught) =>
          showToast(getErrorMessage(caught, '장바구니에 담지 못했어요.')),
      },
    )
  }

  return { addToCart, isAdding: add.isPending }
}
