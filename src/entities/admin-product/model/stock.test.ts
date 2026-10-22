import { describe, expect, it } from 'vitest'

import {
  sortStocksByUrgency,
  stockLevelOf,
  type AdminProductStock,
} from './stock'

const row = (partial: Partial<AdminProductStock>): AdminProductStock => ({
  optionId: 'a',
  color: '실버',
  colorHex: null,
  optionNames: [],
  price: 0,
  registered: true,
  total: 100,
  reserved: 0,
  sold: 0,
  available: 50,
  ...partial,
})

describe('stockLevelOf', () => {
  it('미등록 · 품절 · 임박(10% 이하) · 넉넉', () => {
    expect(
      stockLevelOf(row({ registered: false, available: 0, total: 0 })),
    ).toBe('unregistered')
    expect(stockLevelOf(row({ available: 0 }))).toBe('out')
    expect(stockLevelOf(row({ available: 10 }))).toBe('low')
    expect(stockLevelOf(row({ available: 11 }))).toBe('ok')
  })
})

describe('sortStocksByUrgency', () => {
  it('미등록이 먼저, 그다음 남은 수량이 적은 순', () => {
    const sorted = sortStocksByUrgency([
      row({ optionId: 'plenty', available: 80 }),
      row({ optionId: 'out', available: 0 }),
      row({ optionId: 'none', registered: false, available: 0, total: 0 }),
      row({ optionId: 'low', available: 5 }),
    ])
    expect(sorted.map((item) => item.optionId)).toEqual([
      'none',
      'out',
      'low',
      'plenty',
    ])
  })
})
