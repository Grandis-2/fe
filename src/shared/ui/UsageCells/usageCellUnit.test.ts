import { describe, expect, it } from 'vitest'

import { usageCells } from './usageCellUnit'

describe('usageCells', () => {
  it('1칸 = 1이면 쓴 만큼 채운다', () => {
    expect(usageCells(12, 20)).toEqual({ count: 20, on: 12, full: false })
  })

  it('마지막 칸이 작아도 다 쓰면 모두 채운다', () => {
    expect(usageCells(101, 101, 10)).toEqual({ count: 10, on: 10, full: true })
  })

  it('덜 썼으면 반올림해도 마지막 칸은 비운다', () => {
    expect(usageCells(100, 101, 10).on).toBe(9)
  })
})
