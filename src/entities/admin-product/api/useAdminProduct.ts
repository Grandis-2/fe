import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'
import type { AdminProductDetail } from '@shared/api/types'

import { toStockRequests, toUpsertRequest } from '../model/form'

import {
  createAdminProduct,
  getAdminProduct,
  hideAdminProduct,
  publishAdminProduct,
  updateAdminProduct,
} from './adminProduct'
import { getAdminProductStock, putAdminProductStock } from './adminStock'
import {
  ADMIN_PRODUCTS_KEY,
  adminProductKey,
  adminProductStockKey,
} from './keys'

import type { AdminProductFormValue } from '../model/form'

// 상세 화면의 헤더·탭·재고 표·수정 폼이 같은 상품을 각자 부른다 — 키가 같아서
// 요청은 한 번만 나가고 나머지는 캐시를 함께 쓴다.
export const useAdminProduct = (productId: string) =>
  useQuery({
    queryKey: adminProductKey(productId),
    queryFn: ({ signal }) => getAdminProduct(productId, signal),
    ...queryPolicy.live,
  })

export const useAdminProductStock = (productId: string) =>
  useQuery({
    queryKey: adminProductStockKey(productId),
    queryFn: ({ signal }) => getAdminProductStock(productId, signal),
    select: (response) => response.items,
    ...queryPolicy.live,
  })

/** 상품을 초안으로 등록한다. 응답을 상세 캐시에 넣어 등록 직후 상세 화면이 다시 조회하지 않게 한다 */
export const useCreateAdminProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: AdminProductFormValue) =>
      createAdminProduct(toUpsertRequest(value)),
    onSuccess: (created) =>
      queryClient.setQueryData(adminProductKey(created.productId), created),
  })
}

/**
 * 상품 본문과 조합별 재고를 함께 저장한다. 등록/수정 본문에는 수량 필드가 없어서
 * 재고는 재고 API로 옵션마다 따로 보낸다.
 *
 * 본문 저장(PATCH)이 성공한 뒤 재고 일부가 실패할 수 있다 — 한 번에 저장하는 API가
 * 없어서 되돌릴 수 없다. 그래서 throw하지 않고 실패 건수를 돌려줘, 화면이 "상품은
 * 저장됐고 재고 N건은 실패"를 구분해서 알리게 한다. 본문 저장 실패는 그대로 throw한다.
 */
export const useUpdateAdminProduct = (productId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (value: AdminProductFormValue) => {
      const updated = await updateAdminProduct(
        productId,
        toUpsertRequest(value),
      )
      queryClient.setQueryData(adminProductKey(productId), updated)

      // PATCH가 옵션 코드를 새로 만들므로, 재고는 반드시 그 응답 기준으로 보낸다.
      // 수정 전 상세의 코드로 보내면 새 옵션에 재고가 붙지 않는다.
      const results = await Promise.allSettled(
        toStockRequests(value, updated).map((body) =>
          putAdminProductStock(productId, body),
        ),
      )
      void queryClient.invalidateQueries({
        queryKey: adminProductStockKey(productId),
      })

      return {
        failedStockCount: results.filter(
          (result) => result.status === 'rejected',
        ).length,
      }
    },
  })
}

/**
 * 전시 상태를 바꾼다(게시 ↔ 숨김). 상세 캐시는 응답으로 바로 갱신하고, 목록은
 * 무효화해 다시 받는다 — 목록 행에도 전시 상태가 보여서 같이 바뀌어야 한다.
 */
const useDisplayStatusMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<AdminProductDetail>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(adminProductKey(updated.productId), updated)
      return queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY })
    },
  })
}

export const usePublishAdminProduct = () =>
  useDisplayStatusMutation((productId: string) =>
    publishAdminProduct(productId),
  )

export const useHideAdminProduct = () =>
  useDisplayStatusMutation(
    ({ productId, reason }: { productId: string; reason: string }) =>
      hideAdminProduct(productId, { reason }),
  )
