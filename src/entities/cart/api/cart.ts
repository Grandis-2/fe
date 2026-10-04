import { getProduct } from '@entities/product'
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
  // ponytail: 장바구니 응답엔 상품 ID·옵션 코드뿐이라 상품명·옵션명을 얻으려고 상품 상세를
  // 상품마다 한 번씩 더 부른다. 백엔드가 표시용 필드를 실어 주면 이 조회를 지운다.
  const productIds = [...new Set(items.map((item) => item.productId))]
  const products = await Promise.all(
    productIds.map((productId) => getProduct(productId, signal)),
  )

  return items.map((item) => {
    const product = products.find(
      ({ productId }) => productId === item.productId,
    )
    const variant = product?.variants.find(
      ({ optionCode }) => optionCode === item.optionCode,
    )
    return {
      id: item.cartItemId,
      productId: item.productId,
      imageSrc: product?.thumbnailUrl ?? undefined,
      name: product?.name ?? item.productId,
      modelNumber: product?.modelNumber ?? '',
      optionSummary: variant?.name ?? item.optionCode,
      quantity: item.quantity,
      price: item.unitPrice,
    }
  })
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
