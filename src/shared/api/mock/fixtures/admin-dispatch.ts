import { adminProductStore } from './admin-product'

import type { DispatchWindowVersion } from '../../types'

/** 사전 예약 상품에만 게시된 차수 버전을 하나씩 깔아둔다 */
function seedVersions(): DispatchWindowVersion[] {
  return adminProductStore
    .filter((product) => product.badges.includes('PREORDER'))
    .map((product) => ({
      productId: product.productId,
      version: 1,
      status: 'PUBLISHED' as const,
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
          // 배송일 미정 구간을 허용한다.
          estimatedDeliveryDate: null,
        },
      ],
      undeterminedFromSeq: 1501,
      createdAt: '2026-09-01T00:00:00.000Z',
      createdBy: 'admin',
      publishedAt: '2026-09-02T00:00:00.000Z',
      confirmedCountByWave: null,
    }))
}

export const dispatchWindowStore: DispatchWindowVersion[] = seedVersions()

export const versionsOf = (productId: string) =>
  dispatchWindowStore.filter((version) => version.productId === productId)
