import { apiClient } from '@shared/api/client'
import type {
  Cart,
  CartItemAddRequest,
  CartItemQuantityRequest,
  CartItemResponse,
  CountResponse,
} from '@shared/api/types'

const itemPath = (cartItemId: string) =>
  `/api/v1/cart/items/${encodeURIComponent(cartItemId)}`

// 헤더 배지 — 수량 합이 아니라 줄 수다.
export const getCartCount = async (signal?: AbortSignal) =>
  (await apiClient.request<CountResponse>('/api/v1/cart/count', { signal }))
    .count

// 줄마다 지금 가격·재고·살 수 있는지가 같이 온다(담은 순서).
export const getCartLines = async (signal?: AbortSignal) =>
  (await apiClient.request<Cart>('/api/v1/cart', { signal })).items

// 담기 — 같은 옵션·보증 여부의 줄이 있으면 수량을 더한다. 같은 요청을 다시 보내면 또 더해진다.
export const addCartItem = (body: CartItemAddRequest) =>
  apiClient.request<CartItemResponse>('/api/v1/cart/items', {
    method: 'POST',
    body,
  })

// 수량 변경 — 최종 수량을 보낸다(다시 보내도 결과가 같다).
export const updateCartItemQuantity = ({
  cartItemId,
  quantity,
}: CartItemQuantityRequest & { cartItemId: string }) =>
  apiClient.request<CartItemResponse>(itemPath(cartItemId), {
    method: 'PATCH',
    body: { quantity } satisfies CartItemQuantityRequest,
  })

// 삭제 — 204.
export const removeCartItem = (cartItemId: string) =>
  apiClient.request<void>(itemPath(cartItemId), { method: 'DELETE' })
