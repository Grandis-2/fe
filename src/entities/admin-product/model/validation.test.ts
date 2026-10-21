import { describe, expect, it } from 'vitest'

import { createColorOption, createEmptyProductFormValue } from './form'
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

  it('판매를 끈 조합이나 빈 값은 할인가 검사에서 뺀다', () => {
    const value = {
      ...base,
      basePrice: 150,
      discountRate: 50,
      colors: [{ ...createColorOption(), name: '블랙' }],
      optionGroups: [
        {
          id: 'g',
          name: '용량',
          values: [
            { id: 'a', label: '256GB', extraPrice: 0 },
            { id: 'b', label: '512GB', extraPrice: 100 },
            { id: 'c', label: '', extraPrice: -100 },
          ],
        },
      ],
    }
    // 블랙|256GB(75원)를 끄면 남는 블랙|512GB는 125원이라 통과한다.
    expect(
      discountIssue({ ...value, pausedKeys: ['블랙|256GB'] }),
    ).toBeUndefined()
    expect(discountIssue(value)).toBeDefined()
  })

  it('할인가가 100원보다 작아지는 옵션이 생기면 막는다', () => {
    expect(
      discountIssue({ ...base, basePrice: 150, discountRate: 50 })?.message,
    ).toContain('100원')
  })
})
