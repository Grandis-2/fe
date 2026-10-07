import type { CartItem } from '../../types'

export const cartItems: CartItem[] = [
  {
    cartItemId: 'cart-1',
    productId: '1',
    optionCode: '1-sliver-512GB',
    quantity: 1,
    unitPrice: 2520000,
  },
  {
    cartItemId: 'cart-2',
    productId: '2',
    optionCode: '2-indigo-256GB',
    quantity: 2,
    unitPrice: 1250000,
  },
  {
    // 판매 중지 상품 — "구매 전에 안내" 정책을 화면에서 확인하는 용도.
    cartItemId: 'cart-3',
    productId: '44',
    optionCode: '44-sliver-256GB',
    quantity: 1,
    unitPrice: 59000,
  },
]
