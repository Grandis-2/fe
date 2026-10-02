import { useQuery } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { getCartCount } from './cart'

// 헤더 장바구니 배지용 — 담긴 항목(줄) 수. 비회원은 장바구니가 없으니 요청하지 않는다
// (보내면 401 → 재발급 시도까지 헛돈다).
// 장바구니 담기/삭제를 붙일 땐 성공 시 ['cart']를 invalidate하면 이 개수도 같이 갱신된다.
export const useCartCount = (enabled: boolean) =>
  useQuery({
    queryKey: ['cart', 'count'] as const,
    queryFn: ({ signal }) => getCartCount(signal),
    enabled,
    ...queryPolicy.live,
  })
