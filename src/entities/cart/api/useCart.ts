import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import {
  addCartItem,
  getCartCount,
  getCartLines,
  removeCartItem,
  updateCartItemQuantity,
} from './cart'

export const cartKeys = {
  all: ['cart'] as const,
  count: ['cart', 'count'] as const,
  lines: ['cart', 'lines'] as const,
}

// 헤더 장바구니 배지용 — 담긴 줄 수. 비회원은 장바구니가 없으니 요청하지 않는다
// (보내면 401 → 재발급 시도까지 헛돈다).
export const useCartCount = (enabled: boolean) =>
  useQuery({
    queryKey: cartKeys.count,
    queryFn: ({ signal }) => getCartCount(signal),
    enabled,
    ...queryPolicy.live,
  })

// 가격·재고는 조회할 때마다 지금 값으로 오므로 볼 때마다 새로 묻는다.
export const useCartLines = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: cartKeys.lines,
    queryFn: ({ signal }) => getCartLines(signal),
    enabled,
    ...queryPolicy.live,
  })

// 담기·수량 변경·삭제는 서버 확인 뒤 반영한다 — 응답엔 금액이 없어(줄 금액·살 수 있는지는 조회가 정한다)
// 장바구니 캐시(줄·배지)를 통째로 다시 받는다.
const useCartMutation = <TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  })
}

export const useAddCartItem = () => useCartMutation(addCartItem)
export const useUpdateCartItemQuantity = () =>
  useCartMutation(updateCartItemQuantity)
export const useRemoveCartItem = () => useCartMutation(removeCartItem)
