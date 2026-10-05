import { adminProductStore } from './admin-product'

import type { DispatchWindow } from '../../types'

/** 사전 예약 상품에만 차수 구성을 하나씩 깔아둔다 — 나머지는 아직 정하지 않은 상태다 */
function seedWindows(): DispatchWindow[] {
  return adminProductStore
    .filter((product) => product.badges.includes('PREORDER'))
    .map((product) => ({
      productId: product.productId,
      waves: [
        {
          wave: 1,
          fromSeq: 1,
          toSeq: 500,
          estimatedDeliveryDate: '2026-09-20',
        },
        {
          wave: 2,
          fromSeq: 501,
          toSeq: 1200,
          estimatedDeliveryDate: '2026-09-27',
        },
        {
          wave: 3,
          fromSeq: 1201,
          toSeq: 1500,
          // 순번 구간은 정해졌지만 배송일만 미정인 차수도 있다.
          estimatedDeliveryDate: null,
        },
      ],
      undeterminedFromSeq: 1501,
      updatedAt: '2026-09-02T00:00:00.000Z',
      updatedBy: 'admin',
    }))
}

export const dispatchWindowStore: DispatchWindow[] = seedWindows()

/** 저장된 구성이 없으면 '아무것도 정하지 않음'(1번부터 미정)을 돌려준다 */
export const dispatchWindowOf = (productId: string): DispatchWindow =>
  dispatchWindowStore.find((window) => window.productId === productId) ?? {
    productId,
    waves: [],
    undeterminedFromSeq: 1,
    updatedAt: null,
    updatedBy: null,
  }
