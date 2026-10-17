import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { CartLine } from '@shared/api/types'

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

// 담기·삭제는 서버 확인 뒤 반영한다 — 응답엔 금액이 없어(줄 금액·살 수 있는지는 조회가 정한다)
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
// 수량만은 낙관적으로 — 틀려도 되돌리면 그만인 값이라 누르는 즉시 줄 수량·금액을 바꾸고, 실패하면 되돌린다.
// 연달아 눌러 요청이 겹치면 마지막 요청이 끝난 뒤에 한 번만 다시 받아 서버 값으로 맞춘다
// (중간에 받으면 아직 반영 안 된 수량으로 깜빡인다).
const updateQuantityKey = [...cartKeys.lines, 'update-quantity'] as const

export const useUpdateCartItemQuantity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: updateQuantityKey,
    mutationFn: updateCartItemQuantity,
    onMutate: async ({ cartItemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.lines })
      const previous = queryClient.getQueryData<CartLine[]>(cartKeys.lines)
      queryClient.setQueryData<CartLine[]>(cartKeys.lines, (lines) =>
        lines?.map((line) =>
          line.cartItemId === cartItemId
            ? {
                ...line,
                quantity,
                lineAmount:
                  line.unitPrice === null
                    ? null
                    : (line.unitPrice + (line.warrantyPrice ?? 0)) * quantity,
              }
            : line,
        ),
      )
      return { previous }
    },
    onError: (_error, _variables, context) =>
      queryClient.setQueryData(cartKeys.lines, context?.previous),
    onSettled: () =>
      queryClient.isMutating({ mutationKey: updateQuantityKey }) === 1
        ? queryClient.invalidateQueries({ queryKey: cartKeys.all })
        : undefined,
  })
}
export const useRemoveCartItem = () => useCartMutation(removeCartItem)
