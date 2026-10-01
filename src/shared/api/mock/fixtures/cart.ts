import type { CartItem } from '../../types'

export const cartItems: CartItem[] = [
  {
    cartItemId: 'cart-1',
    productId: 'IP-18-PRO',
    optionCode: '256-STL',
    quantity: 1,
    unitPrice: 2278100,
  },
  {
    cartItemId: 'cart-2',
    productId: 'SM-G999',
    optionCode: '256-BLK',
    quantity: 2,
    unitPrice: 1290000,
  },
  {
    // 판매 종료 상품 — "구매 전에 안내" 정책을 화면에서 확인하는 용도.
    cartItemId: 'cart-3',
    productId: 'MB-NEO',
    optionCode: '256-MID',
    quantity: 1,
    unitPrice: 1690000,
  },
]
