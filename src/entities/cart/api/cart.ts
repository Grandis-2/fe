import { apiClient } from '@shared/api/client'
import type {
  Cart,
  CartItem as CartItemDto,
  CountResponse,
  UpdateCartItemRequest,
} from '@shared/api/types'

import type { CartItem } from '../model/types'

const itemPath = (id: string) => `/api/v1/cart/items/${encodeURIComponent(id)}`

export const getCartCount = async (signal?: AbortSignal) => {
  const { count } = await apiClient.request<CountResponse>(
    '/api/v1/cart/count',
    { signal },
  )
  return count
}

export const getCartItems = async (
  signal?: AbortSignal,
): Promise<CartItem[]> => {
  const { items } = await apiClient.request<Cart>('/api/v1/cart', { signal })
  return items.map((item) => ({
    id: item.cartItemId,
    productId: item.productId,
    optionCode: item.optionCode,
    quantity: item.quantity,
    price: item.unitPrice,
  }))
}

export const updateCartItemQuantity = async ({
  id,
  quantity,
}: Pick<CartItem, 'id' | 'quantity'>): Promise<
  Pick<CartItem, 'id' | 'quantity' | 'price'>
> => {
  const body: UpdateCartItemRequest = { quantity }
  const updated = await apiClient.request<CartItemDto>(itemPath(id), {
    method: 'PATCH',
    body,
  })
  return {
    id: updated.cartItemId,
    quantity: updated.quantity,
    price: updated.unitPrice,
  }
}

export const removeCartItem = (id: string) =>
  apiClient.request<void>(itemPath(id), { method: 'DELETE' })
