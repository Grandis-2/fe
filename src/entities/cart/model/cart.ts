import type {
  CartLine as CartLineDto,
  CartUnavailableReason as CartUnavailableReasonDto,
} from '@shared/api/types'

// 장바구니 한 줄 — 응답 모양 그대로 쓴다. 판매 종료(DISCONTINUED) 줄은 이름·금액 칸이 null이다.
export type CartLine = CartLineDto
export type CartUnavailableReason = CartUnavailableReasonDto

// 살 수 없는 줄에 보여 줄 짧은 문구(order 명세의 장바구니 조회 표).
export const cartUnavailableLabel: Record<CartUnavailableReason, string> = {
  DISCONTINUED: '판매가 종료된 상품이에요. 삭제해 주세요.',
  HIDDEN: '지금은 구매할 수 없는 상품이에요.',
  PAUSED: '판매가 중지된 상품이에요.',
  WARRANTY_UNAVAILABLE:
    '보증을 더 이상 팔지 않아요. 보증 없이 다시 담아 주세요.',
  OUT_OF_STOCK: '품절된 상품이에요.',
  INSUFFICIENT_STOCK: '재고가 부족해요. 수량을 줄여 주세요.',
}
