import { useReservationStatsByProduct } from '@entities/admin-reservation'
import { useWaitingroomStatus, waitEstimate } from '@entities/admin-waitingroom'
import type { RefreshInterval } from '@shared/config/refreshInterval'

import { preorderHealth } from './preorderHealth'

import type { OpenPreorder } from '../ui/OpenPreorderStrip'

/**
 * 지금 접수 중인 사전예약과 각각의 상태. 대기열 현황에서 접수 중(OPEN)인 상품을 고르고,
 * 상품마다 집계를 받아 띠에 그릴 값(대기·재처리 필요·상태)을 만든다. 대기열 현황과 같은
 * 키라 다른 관리자 화면과 캐시를 나눠 쓴다.
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
    const { data, dataUpdatedAt } = productStats[index] ?? {}
    return {
      productId: product.productId,
      name: nameOf(product.productId),
      // 판정 시각은 그 집계를 받은 시각 — 렌더마다 흔들리지 않는다.
      health: data
        ? preorderHealth({
            failures: data.syncJobs.REGISTER.DEAD_LETTER,
            oldestPendingAt: data.oldestPendingSyncAt,
            now: dataUpdatedAt ?? 0,
          })
        : null,
      waiting: product.waiting,
      wait: waitEstimate(product.waiting, product.credit),
      failures: data ? data.syncJobs.REGISTER.DEAD_LETTER : null,
      closesAt: product.closesAt,
    }
  })

  return { queue, openProducts, items, nameOf, statsOf }
}
