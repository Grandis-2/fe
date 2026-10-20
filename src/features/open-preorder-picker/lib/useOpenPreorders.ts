import { useReservationStatsByProduct } from '@entities/admin-reservation'
import { useWaitingroomStatus, waitEstimate } from '@entities/admin-waitingroom'
import type { RefreshInterval } from '@shared/config/refreshInterval'

/** 지금 접수 중인 사전예약 하나 — 대기열 현황과 그 상품의 집계를 합친 값 */
export type OpenPreorder = {
  productId: string
  name: string
  waiting: number
  /** 초당 입장 인원 */
  credit: number
  /** 맨 뒤 예상 대기(waitEstimate). 줄이 없으면 null */
  wait: string | null
  /** 외부 등록 실패(재처리 필요). 못 받았으면 null */
  failures: number | null
  closesAt: string
}

/**
 * 지금 접수 중인 사전예약과 각각의 상태. 대기열 현황에서 접수 중(OPEN)인 상품을 고르고,
 * 상품마다 집계를 받는다. 대기열 현황과 같은 키라 다른 관리자 화면과 캐시를 나눠 쓴다.
 * @param productNames 상품 id → 이름. 대기열 응답엔 id만 있다
 */
export function useOpenPreorders(
  productNames: ReadonlyMap<string, string>,
  intervalMs: RefreshInterval,
) {
  const queue = useWaitingroomStatus(intervalMs)
  const openProducts = (queue.data?.products ?? []).filter(
    (product) => product.phase === 'OPEN',
  )
  const productStats = useReservationStatsByProduct(
    openProducts.map((product) => product.productId),
    intervalMs,
  )
  const nameOf = (productId: string) => productNames.get(productId) ?? productId
  const statsOf = (productId: string) =>
    productStats[
      openProducts.findIndex((product) => product.productId === productId)
    ]?.data

  const items: OpenPreorder[] = openProducts.map((product, index) => {
    const data = productStats[index]?.data
    return {
      productId: product.productId,
      name: nameOf(product.productId),
      waiting: product.waiting,
      credit: product.credit,
      wait: waitEstimate(product.waiting, product.credit),
      failures: data ? data.syncJobs.REGISTER.DEAD_LETTER : null,
      closesAt: product.closesAt,
    }
  })

  return { queue, openProducts, items, nameOf, statsOf }
}
