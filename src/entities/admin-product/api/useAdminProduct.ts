import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryPolicy } from '@shared/api/queryPolicy'

import { toFirstWaveRequest, toUpsertRequest } from '../model/form'

import { putDispatchWindow } from './adminDispatch'
import {
  createAdminProduct,
  getAdminProduct,
  setAdminProductVisibility,
} from './adminProduct'
import { getAdminProductStock } from './adminStock'
import {
  ADMIN_PRODUCTS_KEY,
  adminProductKey,
  adminProductStockKey,
} from './keys'
import { toAdminProductDetail } from './toAdminProduct'

import type { AdminProductFormValue } from '../model/form'

// 상세 화면의 헤더·탭·재고 표·수정 폼이 같은 상품을 각자 부른다 — 키가 같아서
// 함께 떠 있는 동안은 요청이 하나로 합쳐지고 캐시를 함께 쓴다. 대신 staleTime이
// 0이라 탭을 옮겨 재마운트되면 그때 다시 받는다(운영 화면이라 그게 맞다).
export const useAdminProduct = (productId: string) =>
  useQuery({
    queryKey: adminProductKey(productId),
    queryFn: ({ signal }) => getAdminProduct(productId, signal),
    select: toAdminProductDetail,
    ...queryPolicy.live,
  })

/** 조합별 재고 수량. 옵션 이름·가격은 상품 상세에 있어 둘을 합쳐 써야 한다 */
export const useAdminProductStock = (productId: string) =>
  useQuery({
    queryKey: adminProductStockKey(productId),
    queryFn: ({ signal }) => getAdminProductStock(productId, signal),
    select: (response) => response.items,
    ...queryPolicy.live,
  })

/**
 * 상품을 초안으로 등록한다. 응답을 상세 캐시에 넣어 등록 직후 상세 화면이 다시
 * 조회하지 않게 한다.
 *
 * 사전예약이면 1차 배송 차수까지 이어서 만든다 — 폼에서 1차 배송 수량과 예상
 * 배송일을 이미 받았으니, 배송 구간 설정 탭이 빈 화면으로 열리지 않게 한다.
 *
 * 차수는 상품이 만들어진 뒤에야 저장할 수 있어서(경로에 productId가 들어간다)
 * 요청이 두 번 나간다. 차수 저장이 실패해도 상품은 이미 생겼으므로 throw하지
 * 않고 `dispatchSaved: false`로 알려, 화면이 배송 구간 탭으로 보내 다시 넣게 한다.
 */
export const useCreateAdminProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (value: AdminProductFormValue) => {
      const product = await createAdminProduct(toUpsertRequest(value))
      // 등록 응답은 아직 예전 모양이라 상세 캐시에 그대로 넣으면 상세 매퍼가 깨진다.
      // 넣지 않고 목록만 무효화해, 상세는 들어갈 때 새로 받는다.
      void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY })

      const firstWave = toFirstWaveRequest(value)
      if (!firstWave) return { product, dispatchSaved: true }

      const dispatchSaved = await putDispatchWindow(
        product.productId,
        firstWave,
      )
        .then(() => true)
        .catch(() => false)
      return { product, dispatchSaved }
    },
  })
}

/**
 * 공개 여부를 바꾼다. 응답은 공개 여부뿐이라 다시 받는다 — 목록 행에도 전시 상태가
 * 보여서 상세와 같이 바뀌어야 한다.
 */
export const useSetAdminProductVisibility = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      visible,
    }: {
      productId: string
      visible: boolean
    }) => setAdminProductVisibility(productId, { visible }),
    // 목록·상세가 모두 이 접두사 아래라 한 번에 다시 받는다(keys.ts).
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY }),
  })
}
