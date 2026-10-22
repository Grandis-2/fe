import { describe, expect, it } from 'vitest'

import { currentBatchOf, issuedInBatch } from './shipment'

const batches = [
  {
    batchNumber: 1,
    positionFrom: 1,
    positionTo: 5000,
    estimatedShipStart: '2026-10-28',
    estimatedShipEnd: '2026-10-30',
  },
  {
    batchNumber: 2,
    positionFrom: 5001,
    positionTo: 12000,
    estimatedShipStart: '2026-11-04',
    estimatedShipEnd: '2026-11-06',
  },
  {
    batchNumber: 3,
    positionFrom: 12001,
    positionTo: null,
    estimatedShipStart: '2026-11-11',
    estimatedShipEnd: '2026-11-13',
  },
]

describe('issuedInBatch', () => {
  it('발급 수를 차수 구간에 나눈다', () => {
    expect(batches.map((batch) => issuedInBatch(batch, 9830))).toEqual([
      5000, 4830, 0,
    ])
  })

  it('상한 없는 마지막 차수는 넘친 만큼 다 센다', () => {
    expect(issuedInBatch(batches[2], 12500)).toBe(500)
  })
})

describe('currentBatchOf', () => {
  it('다음 순번이 속한 차수', () => {
    expect(currentBatchOf(batches, 0)?.batchNumber).toBe(1)
    expect(currentBatchOf(batches, 5000)?.batchNumber).toBe(2)
    expect(currentBatchOf(batches, 20000)?.batchNumber).toBe(3)
  })
})
