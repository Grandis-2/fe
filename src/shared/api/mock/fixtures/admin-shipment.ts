import { adminProductStore } from './admin-product'

import type { ShipmentBatch } from '../../types'

/** 상품별 배송 차수. 사전예약 상품에만 두 차수를 깔아 두고, 나머지는 아직 정하지 않았다 */
export const shipmentBatchStore = new Map<string, ShipmentBatch[]>(
  adminProductStore
    .filter((product) => product.badges.includes('PREORDER'))
    .map((product) => [
      product.productId,
      [
        {
          batchNumber: 1,
          positionFrom: 1,
          positionTo: 500,
          estimatedShipStart: '2026-11-02',
          estimatedShipEnd: '2026-11-06',
        },
        {
          batchNumber: 2,
          positionFrom: 501,
          positionTo: null,
          estimatedShipStart: '2026-11-16',
          estimatedShipEnd: '2026-11-27',
        },
      ],
    ]),
)
