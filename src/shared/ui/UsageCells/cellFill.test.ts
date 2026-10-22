import { describe, expect, it } from 'vitest'

import { usageCells } from './cellFill'

describe('usageCells', () => {
  it('전체가 얼마든 비율만큼 채운다', () => {
    expect(usageCells(75, 150)).toEqual({ on: 5, full: false })
    expect(usageCells(9, 15)).toEqual({ on: 6, full: false })
  })

  it('다 쓰면 모두 채운다', () => {
    expect(usageCells(150, 150)).toEqual({ on: 10, full: true })
  })

  it('덜 썼으면 마지막 칸은 비우고, 조금이라도 썼으면 한 칸은 채운다', () => {
    expect(usageCells(149, 150).on).toBe(9)
    expect(usageCells(1, 150).on).toBe(1)
    expect(usageCells(0, 150).on).toBe(0)
  })
})
