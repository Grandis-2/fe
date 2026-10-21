import { describe, expect, it } from 'vitest'

import { createEmptyProductFormValue } from './form'
import { validateProductBasics } from './validation'

const base = {
  ...createEmptyProductFormValue(),
  name: '아이폰 18 Pro',
  modelName: 'A3001',
  brand: 'Apple',
  basePrice: 1_200_000,
}
const discountIssue = (value: typeof base) =>
  validateProductBasics(value).find((issue) => issue.field === 'discountRate')

describe('할인율 검사', () => {
  it('0~99 정수면 통과한다', () => {
    expect(discountIssue({ ...base, discountRate: 0 })).toBeUndefined()
    expect(discountIssue({ ...base, discountRate: 99 })).toBeUndefined()
  })

  it('범위를 벗어나면 막는다', () => {
    expect(discountIssue({ ...base, discountRate: 100 })).toBeDefined()
  })

  it('할인가가 100원보다 작아지는 옵션이 생기면 막는다', () => {
    expect(
      discountIssue({ ...base, basePrice: 150, discountRate: 50 })?.message,
    ).toContain('100원')
  })
})
