import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import {
  getCartCount,
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from './cart'

import type { CartItem } from '../model/types'

const countKey = ['cart', 'count'] as const
const itemsKey = ['cart', 'items'] as const

// 헤더 장바구니 배지용 — 담긴 항목(줄) 수. 비회원은 장바구니가 없으니 요청하지 않는다
// (보내면 401 → 재발급 시도까지 헛돈다).
// 장바구니 담기/삭제를 붙일 땐 성공 시 ['cart']를 invalidate하면 이 개수도 같이 갱신된다.
export const useCartCount = (enabled: boolean) =>
  useQuery({
    queryKey: countKey,
    queryFn: ({ signal }) => getCartCount(signal),
    enabled,
    ...queryPolicy.live,
  })

export const useCartItems = () =>
  useQuery({
    queryKey: itemsKey,
    queryFn: ({ signal }) => getCartItems(signal),
    ...queryPolicy.live,
  })

// 수정·삭제는 응답으로 캐시를 직접 고친다 — 목록을 다시 부르면 상품 상세까지 다시 조회한다.
export const useUpdateCartItemQuantity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCartItemQuantity,
    onSuccess: (updated) =>
      queryClient.setQueryData<CartItem[]>(itemsKey, (items) =>
        items?.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item,
        ),
      ),
  })
}

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (_, id) => {
      queryClient.setQueryData<CartItem[]>(itemsKey, (items) =>
        items?.filter((item) => item.id !== id),
      )
      // 줄 수가 바뀌었으니 헤더 배지는 다시 묻는다.
      return queryClient.invalidateQueries({ queryKey: countKey })
    },
  })
}
