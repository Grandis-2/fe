import { useRef } from 'react'

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { ApiRequestError } from '@shared/api/client'
import { queryPolicy } from '@shared/api/queryPolicy'
import type {
  ProductRegistrationRequest,
  SaleStatusChangeRequest,
} from '@shared/api/types'

import { toRegistrationRequest } from '../model/registration'

import {
  getAdminProduct,
  getRegistrationStatus,
  registerAdminProduct,
  setAdminProductSaleStatus,
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

/**
 * 여러 상품의 상세를 한 번에 받는다 — 목록에 없는 옵션(색상·용량)이 필요할 때.
 * 상세 화면과 키가 같아 이미 받은 상품은 다시 부르지 않고 캐시를 쓴다.
 */
export const useAdminProductDetails = (productIds: string[]) =>
  useQueries({
    queries: productIds.map((productId) => ({
      queryKey: adminProductKey(productId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getAdminProduct(productId, signal),
      select: toAdminProductDetail,
      ...queryPolicy.live,
    })),
  })

/** 조합별 재고 수량. 옵션 이름·가격은 상품 상세에 있어 둘을 합쳐 써야 한다 */
export const useAdminProductStock = (productId: string) =>
  useQuery({
    queryKey: adminProductStockKey(productId),
    queryFn: ({ signal }) => getAdminProductStock(productId, signal),
    select: (response) => response.items,
    ...queryPolicy.live,
  })

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 같은 키 요청이 처리 중(409 REGISTRATION_IN_PROGRESS)이면 잠시 뒤 같은 키로 다시
// 보낸다 — 명세가 그렇게 하라고 한다. 다른 실패는 그대로 던진다.
const IN_PROGRESS_RETRIES = 4
const IN_PROGRESS_DELAY_MS = 1000

async function register(key: string, body: ProductRegistrationRequest) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await registerAdminProduct(key, body)
    } catch (caught) {
      const inProgress =
        caught instanceof ApiRequestError &&
        caught.error.code === 'REGISTRATION_IN_PROGRESS'
      if (!inProgress || attempt >= IN_PROGRESS_RETRIES) throw caught
      await delay(IN_PROGRESS_DELAY_MS)
    }
  }
}

// 준비(사전예약 회차·일반 재고 생성)가 끝날 때까지 몇 초 간격으로 확인한다.
const READY_POLL_MS = 1500
const READY_POLL_TRIES = 20

/**
 * 준비가 끝났는지 기다린다. 여기서 나는 실패는 삼킨다 — 상품은 이미 등록됐는데 확인
 * 요청이 실패했다고 등록 실패로 보이면, 관리자가 다시 눌러 같은 상품을 또 만든다.
 * 끝내 확인이 안 되면 준비 중으로 둔다(상세에서 '초안'으로 보인다).
 */
async function waitUntilReady(key: string) {
  for (let attempt = 0; attempt < READY_POLL_TRIES; attempt += 1) {
    await delay(READY_POLL_MS)
    const status = await getRegistrationStatus(key).catch(() => null)
    if (status?.completed) return true
  }
  return false
}

/**
 * 상품을 등록한다. 사전예약은 회차·1차 배송 차수까지, 일반 상품은 조합별 재고까지
 * 한 번에 보낸다.
 *
 * 등록 키는 응답을 받을 때까지 유지한다. 응답을 못 받았거나(네트워크·타임아웃) 서버
 * 장애로 실패하면 이미 등록됐을 수 있어서, 다시 누르면 같은 키를 보낸다 — 서버는 같은
 * 키면 새로 만들지 않고 처음 상품을 돌려준다. 서버가 본문을 보고 거절한 400만 고쳐서
 * 새로 보내는 것이라 키를 버린다.
 */
export const useCreateAdminProduct = () => {
  const queryClient = useQueryClient()
  const keyRef = useRef<string | null>(null)

  return useMutation({
    mutationFn: async (value: AdminProductFormValue) => {
      keyRef.current ??= crypto.randomUUID()
      const key = keyRef.current
      const { registration } = await register(key, toRegistrationRequest(value))
      // 등록은 끝났다 — 다음 등록은 새 키로 한다.
      keyRef.current = null

      const ready = registration.completed || (await waitUntilReady(key))
      return { productId: registration.productId, ready }
    },
    onError: (caught) => {
      if (caught instanceof ApiRequestError && caught.status === 400) {
        keyRef.current = null
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY }),
  })
}

/**
 * 판매 상태를 바꾼다(판매 중지·재개·회차 취소). 자동 재시도하지 않는다 — 회차 취소는
 * 두 번 보내도 서버가 한 번으로 보지만, 중지·재개는 순서가 꼬이면 반대 상태가 된다.
 */
export const useSetAdminProductSaleStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      ...body
    }: { productId: string } & SaleStatusChangeRequest) =>
      setAdminProductSaleStatus(productId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY }),
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
